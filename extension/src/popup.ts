import { storage } from "./lib/storage";
import { queue } from "./lib/queue";
import { AuthError, verifyToken } from "./lib/api";

/** 弹窗状态 */
type PopupState = {
  token: string;
  syncEnabled: boolean;
  /** Token 有效性：null 未校验，true 有效，false 无效 */
  tokenValid: boolean | null;
  queueCount: number;
  status: "idle" | "saving" | "success" | "exists" | "error" | "authError" | "noToken";
  message: string;
};

const state: PopupState = {
  token: "",
  syncEnabled: true,
  tokenValid: null,
  queueCount: 0,
  status: "idle",
  message: "",
};

/** SVG 图标集合（统一描边风格） */
const ICONS = {
  bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`,
  loader: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
};

/**
 * 初始化弹窗状态
 *
 * @description 从存储读取配置与队列数量并渲染
 */
async function init(): Promise<void> {
  state.token = await storage.getToken();
  state.syncEnabled = await storage.getSyncEnabled();
  state.queueCount = (await storage.getFailedQueue()).length;
  render();

  // 打开时尝试刷新失败队列，完成后更新数量
  await queue.flush();
  state.queueCount = (await storage.getFailedQueue()).length;
  render();

  // 已配置 Token 时后台静默校验有效性，更新右上角状态
  if (state.token) {
    try {
      await verifyToken(state.token);
      state.tokenValid = true;
    } catch (error) {
      state.tokenValid = error instanceof AuthError ? false : null;
    }
    render();
  }
}

/** 获取当前活动标签页 */
async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

/**
 * 收藏当前页
 *
 * @description 取当前标签页 URL/标题/favicon 推送，根据响应更新状态
 */
async function handleSaveCurrent(): Promise<void> {
  if (!state.token) {
    setStatus("noToken", "请先在设置中配置 API Token");
    return;
  }

  const tab = await getActiveTab();
  if (!tab || !tab.url) {
    setStatus("error", "无法获取当前页信息");
    return;
  }

  state.status = "saving";
  state.message = "";
  render();

  const payload = {
    url: tab.url,
    title: tab.title || tab.url,
    favicon: tab.favIconUrl,
  };

  try {
    const { alreadyExists } = await queue.push(payload);
    if (alreadyExists) {
      setStatus("exists", "已在书签库中");
    } else {
      setStatus("success", "已收藏到书签库");
    }
  } catch (error) {
    if (error instanceof AuthError) {
      state.tokenValid = false;
      setStatus("authError", "Token 无效，请检查");
    } else {
      setStatus("error", "网络异常，将稍后重试");
    }
  }
  state.queueCount = (await storage.getFailedQueue()).length;
  render();
}

/**
 * 切换同步开关
 *
 * @description 写入存储并更新开关显示
 */
async function handleToggleSync(): Promise<void> {
  state.syncEnabled = !state.syncEnabled;
  await storage.setSyncEnabled(state.syncEnabled);
  render();
}

/**
 * 打开配置页
 *
 * @description 在新标签页打开 options.html；可传入 hash 定位到队列区
 */
function openOptions(hash?: string): void {
  const url = hash
    ? chrome.runtime.getURL(`options.html${hash}`)
    : chrome.runtime.getURL("options.html");
  void chrome.tabs.create({ url });
}

/**
 * 设置状态并渲染
 *
 * @param status - 状态类型
 * @param message - 提示文案
 */
function setStatus(status: PopupState["status"], message: string): void {
  state.status = status;
  state.message = message;
  render();
}

/** 状态条对应的图标 */
function statusIcon(status: PopupState["status"]): string {
  switch (status) {
    case "success":
      return ICONS.check;
    case "exists":
      return ICONS.info;
    default:
      return ICONS.alert;
  }
}

/**
 * 渲染弹窗 UI
 *
 * @description 根据状态渲染头部、收藏按钮、同步开关、队列提示、设置入口
 */
function render(): void {
  const root = document.getElementById("root");
  if (!root) return;

  const isSaving = state.status === "saving";
  const hasToken = state.token.trim().length > 0;
  // 连接状态三态：未配置 / 已连接(Token 有效) / Token 无效
  const connClass = !hasToken ? "" : state.tokenValid === false ? "invalid" : "on";
  const connLabel = !hasToken ? "未配置" : state.tokenValid === false ? "Token 无效" : "已连接";
  const showStatus = !!state.message && state.status !== "idle" && state.status !== "saving";
  const statusCls = state.status;
  const statusMsg = state.message;
  const statusIco = showStatus ? statusIcon(state.status) : "";

  root.innerHTML = `
    <div class="wrap">
      <div class="header">
        <div class="logo">${ICONS.bookmark}</div>
        <h1>Bookmark Lite</h1>
        <span id="conn-badge" class="conn ${connClass}" title="点击打开设置">
          <span class="dot"></span>${connLabel}
        </span>
      </div>

      <button id="save-current" class="save-btn" ${isSaving ? "disabled" : ""}>
        <span class="${isSaving ? "spin" : ""}">${isSaving ? ICONS.loader : ICONS.plus}</span>
        ${isSaving ? "收藏中…" : "收藏当前页"}
      </button>

      <div class="status ${showStatus ? statusCls : "empty"}">
        ${showStatus ? `<span>${statusIco}</span><span>${statusMsg}</span>` : ""}
      </div>

      <div class="field">
        <div class="toggle-row">
          <div class="toggle-text">
            <span class="t">被动同步</span>
            <span class="d">浏览器原生收藏时自动推送</span>
          </div>
          <button id="sync-toggle" class="switch ${state.syncEnabled ? "on" : ""}">
            <span class="knob"></span>
          </button>
        </div>
        ${
          state.queueCount > 0
            ? `<div id="queue-note" class="queue-note">${ICONS.refresh}<span>${state.queueCount} 条待重试，重新打开时自动重试</span></div>`
            : ""
        }
      </div>

      <div id="settings-entry" class="settings-entry">
        ${ICONS.settings}<span>设置</span>
      </div>
    </div>
  `;

  document.getElementById("save-current")?.addEventListener("click", handleSaveCurrent);
  document.getElementById("sync-toggle")?.addEventListener("click", handleToggleSync);
  document.getElementById("conn-badge")?.addEventListener("click", () => openOptions());
  document.getElementById("settings-entry")?.addEventListener("click", () => openOptions());
  document.getElementById("queue-note")?.addEventListener("click", () => openOptions("#queue"));
}

document.addEventListener("DOMContentLoaded", init);
