/**
 * 埋点设备类型
 */
export type AnalyticsDeviceType = "desktop" | "tablet" | "mobile";

/**
 * UTM 来源参数（从着陆页 URL 查询串中解析出的推广渠道信息）
 */
export type AnalyticsUtmParams = {
  /** 推广来源（utm_source，如 google / newsletter） */
  source?: string;
  /** 推广媒介（utm_medium，如 cpc / email） */
  medium?: string;
  /** 推广活动名称（utm_campaign） */
  campaign?: string;
  /** 推广关键词（utm_term） */
  term?: string;
  /** 推广内容变体（utm_content，用于区分同一广告的不同素材） */
  content?: string;
};

/**
 * 埋点身份信息（所有客户端事件自动附带，保证 UV 与会话统计口径统一）
 */
export type AnalyticsIdentityPayload = {
  /** 匿名访客标识（localStorage 持久化，UV 去重依据） */
  visitorId: string;
  /** 会话标识（30 分钟无活动过期，会话数与跳出率统计依据） */
  sessionId: string;
};

/**
 * 页面浏览事件载荷
 */
export type PageViewEventPayload = AnalyticsIdentityPayload & {
  /** 页面路径（含查询串，不含 hash） */
  path: string;
  /** 页面标题（document.title） */
  title: string;
  /** 着陆页的外部来源地址（同站来源与直接访问记为 null，会话内所有页面共享） */
  referrer: string | null;
  /** 着陆页解析出的 UTM 参数（无推广参数时为 null） */
  utm: AnalyticsUtmParams | null;
  /** 设备类型（由 User-Agent 粗略判定） */
  deviceType: AnalyticsDeviceType;
  /** 屏幕分辨率（如 "1920x1080"） */
  screen: string;
  /** 浏览器语言（如 "zh-CN"） */
  language: string;
};

/**
 * 指标上报请求体（与 /api/metrics 接口入参结构一致）
 */
export type MetricsTrackRequest = {
  /** 事件名（snake_case，服务端限制最长 100 字符） */
  eventName: string;
  /** 数据范围（可选，与服务端 DataScope 枚举一致；客户端事件通常留空由服务端归属） */
  scope?: "APP" | "USER";
  /** 事件载荷（键值对，值允许嵌套结构） */
  payload?: Record<string, unknown>;
};
