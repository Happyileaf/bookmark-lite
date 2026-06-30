import { storage } from "./lib/storage";
import { queue } from "./lib/queue";
import { AuthError, verifyToken } from "./lib/api";
import type { BookmarkPayload } from "./lib/storage";

/** 弹窗状态 */
type PopupState = {
  token: string;
  syncEnabled: boolean;
  tokenVisible: boolean;
  verifyingToken: boolean;
  /** Token 有效性：null 未校验，true 有效，false 无效 */
  tokenValid: boolean | null;
  queueCount: number;
  status: "idle" | "saving" | "success" | "exists" | "error" | "authError" | "noToken";
  message: string;
};

const state: PopupState = {
  token: "",
  syncEnabled: true,
  tokenVisible: false,
  verifyingToken: false,
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
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
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
    setStatus("noToken", "请先填写 API Token");
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

  const payload: BookmarkPayload = {
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
 * 保存 Token
 *
 * @description 先调用平台校验 Token 有效性，通过后写入存储；无效则提示且不保存
 */
async function handleSaveToken(): Promise<void> {
  const token = state.token.trim();
  if (!token) {
    setStatus("noToken", "请先填写 API Token");
    return;
  }

  state.verifyingToken = true;
  state.status = "idle";
  state.message = "";
  render();

  try {
    await verifyToken(token);
    await storage.setToken(token);
    state.tokenValid = true;
    setStatusAfterVerify("success", "Token 有效，已保存");
  } catch (error) {
    if (error instanceof AuthError) {
      // 校验失败不保存：回滚输入框为已存储的 Token，tokenValid 保持反映已存储值
      state.token = await storage.getToken();
      setStatusAfterVerify("authError", "新 Token 无效，未保存");
    } else {
      setStatusAfterVerify("error", "校验失败，请检查网络");
    }
  }
}

/**
 * 校验结束后更新状态并取消校验中标记
 *
 * @param status - 状态类型
 * @param message - 提示文案
 */
function setStatusAfterVerify(status: PopupState["status"], message: string): void {
  state.verifyingToken = false;
  setStatus(status, message);
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
 * @description 根据状态渲染头部、收藏按钮、Token 配置、同步开关、队列提示
 */
function render(): void {
  const root = document.getElementById("root");
  if (!root) return;

  const isSaving = state.status === "saving";
  const verifying = state.verifyingToken;
  const hasToken = state.token.trim().length > 0;
  // 连接状态三态：未配置 / 已连接(Token 有效) / Token 无效
  const connClass = !hasToken ? "" : state.tokenValid === false ? "invalid" : "on";
  const connLabel = !hasToken ? "未配置" : state.tokenValid === false ? "Token 无效" : "已连接";
  const showStatus = verifying || (!!state.message && state.status !== "idle" && state.status !== "saving");
  const statusCls = verifying ? "verifying" : state.status;
  const statusMsg = verifying ? "校验中…" : state.message;
  const statusIco = verifying ? ICONS.loader : (showStatus ? statusIcon(state.status) : "");

  root.innerHTML = `
    <div class="wrap">
      <div class="header">
        <div class="logo">${ICONS.bookmark}</div>
        <h1>Bookmark Lite</h1>
        <span class="conn ${connClass}">
          <span class="dot"></span>${connLabel}
        </span>
      </div>

      <div class="field no-divider">
        <span class="label">API Token</span>
        <div class="token-row">
          <div class="input-wrap">
            <input id="token-input" type="${state.tokenVisible ? "text" : "password"}"
              value="${escapeHtml(state.token)}" placeholder="粘贴 Token 明文" class="token-input" />
            <button id="toggle-eye" class="eye" title="显示/隐藏">
              ${state.tokenVisible ? ICONS.eyeOff : ICONS.eye}
            </button>
          </div>
          <button id="save-token" class="btn-ghost" ${state.verifyingToken ? "disabled" : ""}>
            ${state.verifyingToken ? `<span class="spin">${ICONS.loader}</span>` : "保存"}
          </button>
        </div>
      </div>

      <button id="save-current" class="save-btn" ${isSaving ? "disabled" : ""}>
        <span class="${isSaving ? "spin" : ""}">${isSaving ? ICONS.loader : ICONS.plus}</span>
        ${isSaving ? "收藏中…" : "收藏当前页"}
      </button>

      <div class="status ${showStatus ? statusCls : "empty"}">
        ${showStatus ? `<span class="${verifying ? "spin" : ""}">${statusIco}</span><span>${statusMsg}</span>` : ""}
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
            ? `<div class="queue-note">${ICONS.refresh}<span>${state.queueCount} 条待重试，重新打开时自动重试</span></div>`
            : ""
        }
      </div>
    </div>
  `;

  document.getElementById("save-current")?.addEventListener("click", handleSaveCurrent);
  document.getElementById("save-token")?.addEventListener("click", handleSaveToken);
  document.getElementById("toggle-eye")?.addEventListener("click", () => {
    state.tokenVisible = !state.tokenVisible;
    render();
  });
  document.getElementById("token-input")?.addEventListener("input", (e) => {
    state.token = (e.target as HTMLInputElement).value;
  });
  document.getElementById("sync-toggle")?.addEventListener("click", handleToggleSync);
}

/** 转义 HTML 防止 Token 中的特殊字符破坏模板 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", init);
