import { ANALYTICS_EVENT_NAMES } from "@/lib/analytics/constants";
import type {
  AnalyticsDeviceType,
  AnalyticsIdentityPayload,
  AnalyticsUtmParams,
  MetricsTrackRequest,
  PageViewEventPayload,
} from "@/lib/analytics/types";

/** 指标上报接口地址（复用服务端统一事件入口） */
const METRICS_ENDPOINT = "/api/metrics";

/** 本地存储中访客标识的键名 */
const VISITOR_STORAGE_KEY = "bml_analytics_visitor";

/** 本地存储中会话信息的键名 */
const SESSION_STORAGE_KEY = "bml_analytics_session";

/** 会话过期时长（30 分钟无活动后再次访问视为新会话） */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/** 发送失败待重试队列的最大长度（超出后丢弃最旧事件，防止内存无限增长） */
const MAX_PENDING_EVENTS = 50;

/** 是否尊重浏览器的 Do Not Track 设置（开启后 DNT 用户完全不上报） */
const RESPECT_DO_NOT_TRACK = true;

/**
 * 埋点会话信息（localStorage 持久化，含着陆来源与 UTM，会话内所有页面共享）
 */
type AnalyticsSession = {
  /** 会话标识（UUID） */
  id: string;
  /** 最后活跃时间戳（毫秒），超过 SESSION_TIMEOUT_MS 未活动则会话过期 */
  lastActiveAt: number;
  /** 着陆页的外部来源地址（同站来源与直接访问为 null） */
  referrer: string | null;
  /** 着陆页解析出的 UTM 参数（无推广参数时为 null） */
  utm: AnalyticsUtmParams | null;
};

/** 发送失败的事件队列（内存态，网络恢复或页面隐藏时尽力重发） */
const pendingEvents: MetricsTrackRequest[] = [];

/** 上一次已上报的页面路径（用于 React StrictMode 双执行与同路径重复导航的去重） */
let lastTrackedPath: string | null = null;

/** 是否正在重发待处理事件（避免并发清空队列） */
let isFlushingPendingEvents = false;

/** 是否已注册生命周期监听（懒初始化，保证仅注册一次） */
let hasRegisteredLifecycleListeners = false;

/**
 * 生成唯一标识
 *
 * @description 优先使用 crypto.randomUUID，不可用时降级为随机数方案（兼容非安全上下文）
 * @returns UUID 格式的字符串
 * @example
 * const id = createId();
 */
function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (token) => {
    const randomValue = (Math.random() * 16) | 0;
    const value = token === "x" ? randomValue : (randomValue & 0x3) | 0x8;
    return value.toString(16);
  });
}

/**
 * 读取本地存储
 *
 * @description 读取 localStorage 中的字符串值，存储不可用（如隐私模式）时返回 null
 * @param key - 存储键名
 * @returns 存储的字符串值，不存在或读取失败时返回 null
 * @example
 * const visitorId = readStorage(VISITOR_STORAGE_KEY);
 */
function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * 写入本地存储
 *
 * @description 向 localStorage 写入字符串值，存储不可用时静默忽略（不影响上报主流程）
 * @param key - 存储键名
 * @param value - 待写入的字符串值
 * @returns 无返回值
 * @example
 * writeStorage(VISITOR_STORAGE_KEY, visitorId);
 */
function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 存储不可用时身份标识仅保留在内存中，本次页面会话内统计仍然可用
  }
}

/**
 * 判断是否允许上报
 *
 * @description 尊重 Do Not Track 设置，并过滤自动化工具（webdriver）产生的流量
 * @returns 允许上报返回 true，否则返回 false
 * @example
 * if (!shouldTrack()) return;
 */
function shouldTrack(): boolean {
  if (RESPECT_DO_NOT_TRACK && navigator.doNotTrack === "1") {
    return false;
  }
  if (navigator.webdriver) {
    return false;
  }
  return true;
}

/**
 * 判定设备类型
 *
 * @description 基于 User-Agent 关键字粗略区分桌面、平板与手机，用于受众设备分布统计
 * @returns 设备类型
 * @example
 * const deviceType = detectDeviceType();
 */
function detectDeviceType(): AnalyticsDeviceType {
  const userAgent = navigator.userAgent;
  if (/ipad|tablet|playbook|silk/i.test(userAgent) || (/android/i.test(userAgent) && !/mobi/i.test(userAgent))) {
    return "tablet";
  }
  if (/mobi|iphone|ipod|android|blackberry|phone/i.test(userAgent)) {
    return "mobile";
  }
  return "desktop";
}

/**
 * 解析 UTM 参数
 *
 * @description 从 URL 查询串中提取 utm_source 等五个推广参数，全部缺失时返回 null
 * @param search - URL 查询串（window.location.search）
 * @returns 解析出的 UTM 参数，无推广参数时返回 null
 * @example
 * const utm = parseUtmParams("?utm_source=google&utm_medium=cpc");
 */
function parseUtmParams(search: string): AnalyticsUtmParams | null {
  const params = new URLSearchParams(search);
  const utm: AnalyticsUtmParams = {
    source: params.get("utm_source") ?? undefined,
    medium: params.get("utm_medium") ?? undefined,
    campaign: params.get("utm_campaign") ?? undefined,
    term: params.get("utm_term") ?? undefined,
    content: params.get("utm_content") ?? undefined,
  };
  const hasAnyValue = Object.values(utm).some((value) => value !== undefined);
  return hasAnyValue ? utm : null;
}

/**
 * 获取外部来源地址
 *
 * @description 读取 document.referrer 并过滤同站来源，直接访问与同站跳转均记为 null
 * @returns 外部来源地址，直接访问、同站来源或读取失败时返回 null
 * @example
 * const referrer = getExternalReferrer();
 */
function getExternalReferrer(): string | null {
  try {
    const referrer = document.referrer;
    if (!referrer) {
      return null;
    }
    return new URL(referrer).origin === window.location.origin ? null : referrer;
  } catch {
    return null;
  }
}

/**
 * 获取或创建访客标识
 *
 * @description 从 localStorage 读取匿名访客 ID，不存在则生成并持久化；存储不可用时每次调用生成新值
 * @returns 匿名访客标识（UUID）
 * @example
 * const visitorId = getOrCreateVisitorId();
 */
function getOrCreateVisitorId(): string {
  const existing = readStorage(VISITOR_STORAGE_KEY);
  if (existing) {
    return existing;
  }
  const visitorId = createId();
  writeStorage(VISITOR_STORAGE_KEY, visitorId);
  return visitorId;
}

/**
 * 读取持久化的会话信息
 *
 * @description 从 localStorage 读取会话并校验结构完整性，数据缺失或损坏时返回 null
 * @returns 会话信息，不存在或数据损坏时返回 null
 * @example
 * const session = readSession();
 */
function readSession(): AnalyticsSession | null {
  const raw = readStorage(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AnalyticsSession>;
    if (typeof parsed.id !== "string" || typeof parsed.lastActiveAt !== "number") {
      return null;
    }
    return {
      id: parsed.id,
      lastActiveAt: parsed.lastActiveAt,
      referrer: typeof parsed.referrer === "string" ? parsed.referrer : null,
      utm: parsed.utm ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * 创建新会话
 *
 * @description 生成会话 ID 并捕获着陆来源（referrer 与 UTM 仅在创建会话时记录一次）
 * @param now - 当前时间戳（毫秒）
 * @returns 新创建的会话信息
 * @example
 * const session = createSession(Date.now());
 */
function createSession(now: number): AnalyticsSession {
  const session: AnalyticsSession = {
    id: createId(),
    lastActiveAt: now,
    referrer: getExternalReferrer(),
    utm: parseUtmParams(window.location.search),
  };
  writeStorage(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

/**
 * 获取当前有效会话
 *
 * @description 会话未过期时顺延最后活跃时间并复用，过期或不存在时创建新会话
 * @returns 当前有效的会话信息
 * @example
 * const session = getActiveSession();
 */
function getActiveSession(): AnalyticsSession {
  const now = Date.now();
  const existing = readSession();
  if (existing && now - existing.lastActiveAt < SESSION_TIMEOUT_MS) {
    const renewed: AnalyticsSession = { ...existing, lastActiveAt: now };
    writeStorage(SESSION_STORAGE_KEY, JSON.stringify(renewed));
    return renewed;
  }
  return createSession(now);
}

/**
 * 构建事件身份信息
 *
 * @description 获取访客标识与当前会话标识，作为所有客户端事件的公共载荷字段
 * @returns 身份载荷（visitorId 与 sessionId）
 * @example
 * const identity = buildIdentityPayload();
 */
function buildIdentityPayload(): AnalyticsIdentityPayload {
  return {
    visitorId: getOrCreateVisitorId(),
    sessionId: getActiveSession().id,
  };
}

/**
 * 发送单条事件到服务端
 *
 * @description 优先使用 sendBeacon（页面卸载时仍可靠投递），不可用时降级为 keepalive fetch；
 * 仅在网络层失败时返回 false，服务端已响应（含 4xx/5xx）视为已送达不再重试
 * @param body - 上报请求体
 * @returns 发送成功（或已投递）返回 true，网络失败返回 false
 * @example
 * const sent = await sendToServer({ eventName: "page_view", payload });
 */
async function sendToServer(body: MetricsTrackRequest): Promise<boolean> {
  const serialized = JSON.stringify(body);
  try {
    if (typeof navigator.sendBeacon === "function") {
      const queued = navigator.sendBeacon(
        METRICS_ENDPOINT,
        new Blob([serialized], { type: "application/json" }),
      );
      if (queued) {
        return true;
      }
    }
    await fetch(METRICS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: serialized,
      credentials: "same-origin",
      keepalive: true,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * 将失败事件加入待重试队列
 *
 * @description 网络发送失败的事件进入内存队列，队列满时丢弃最旧事件
 * @param body - 待重试的上报请求体
 * @returns 无返回值
 * @example
 * enqueuePendingEvent(body);
 */
function enqueuePendingEvent(body: MetricsTrackRequest): void {
  if (pendingEvents.length >= MAX_PENDING_EVENTS) {
    pendingEvents.shift();
  }
  pendingEvents.push(body);
}

/**
 * 重发待处理事件
 *
 * @description 按入队顺序重发失败事件，遇网络仍失败时保留剩余事件等待下次触发；
 * 通过并发守卫避免多个生命周期事件同时触发导致的重复发送
 * @returns 无返回值
 * @example
 * await flushPendingEvents();
 */
async function flushPendingEvents(): Promise<void> {
  if (isFlushingPendingEvents || pendingEvents.length === 0) {
    return;
  }
  isFlushingPendingEvents = true;
  try {
    while (pendingEvents.length > 0) {
      const oldest = pendingEvents[0];
      const sent = await sendToServer(oldest);
      if (!sent) {
        break;
      }
      pendingEvents.shift();
    }
  } finally {
    isFlushingPendingEvents = false;
  }
}

/**
 * 派发事件
 *
 * @description 先尝试重发历史失败事件，再发送当前事件；当前事件发送失败时进入待重试队列
 * @param body - 上报请求体
 * @returns 无返回值
 * @example
 * await dispatchEvent({ eventName: "page_view", payload });
 */
async function dispatchEvent(body: MetricsTrackRequest): Promise<void> {
  await flushPendingEvents();
  const sent = await sendToServer(body);
  if (!sent) {
    enqueuePendingEvent(body);
  }
}

/**
 * 注册生命周期监听
 *
 * @description 在网络恢复、页面隐藏与页面卸载时触发待重试队列的清空，保证事件尽量不丢失；
 * 懒初始化执行，仅注册一次
 * @returns 无返回值
 * @example
 * ensureLifecycleListeners();
 */
function ensureLifecycleListeners(): void {
  if (hasRegisteredLifecycleListeners) {
    return;
  }
  hasRegisteredLifecycleListeners = true;
  const handleFlushTrigger = () => {
    void flushPendingEvents();
  };
  window.addEventListener("online", handleFlushTrigger);
  window.addEventListener("pagehide", handleFlushTrigger);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      handleFlushTrigger();
    }
  });
}

/**
 * 上报页面浏览事件
 *
 * @description 由挂载组件在路由变化时调用，自动携带路径、标题、来源、UTM、设备与身份信息；
 * 同一路径连续触发（含 React StrictMode 双执行）仅上报一次
 * @returns 无返回值
 * @example
 * useEffect(() => {
 *   trackPageView();
 * }, [pathname, searchParams]);
 */
export function trackPageView(): void {
  if (typeof window === "undefined" || !shouldTrack()) {
    return;
  }
  ensureLifecycleListeners();
  const path = `${window.location.pathname}${window.location.search}`;
  if (path === lastTrackedPath) {
    return;
  }
  lastTrackedPath = path;

  const session = getActiveSession();
  const payload: PageViewEventPayload = {
    path,
    title: document.title,
    referrer: session.referrer,
    utm: session.utm,
    visitorId: getOrCreateVisitorId(),
    sessionId: session.id,
    deviceType: detectDeviceType(),
    screen: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
  };
  void dispatchEvent({ eventName: ANALYTICS_EVENT_NAMES.PAGE_VIEW, payload });
}

/**
 * 上报自定义事件
 *
 * @description 供业务代码手动埋点，自动附加访客与会话身份信息；payload 中的同名字段不会覆盖身份信息
 * @param eventName - 事件名（snake_case，建议引用 ANALYTICS_EVENT_NAMES 常量）
 * @param payload - 事件业务载荷（可选，键值对结构）
 * @returns 无返回值
 * @example
 * trackAnalyticsEvent("bookmark_clicked", { bookmarkId: "xxx", position: 3 });
 */
export function trackAnalyticsEvent(eventName: string, payload?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !shouldTrack()) {
    return;
  }
  ensureLifecycleListeners();
  void dispatchEvent({
    eventName,
    payload: { ...payload, ...buildIdentityPayload() },
  });
}
