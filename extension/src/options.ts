import { storage } from "./lib/storage";
import { queue } from "./lib/queue";
import { AuthError, verifyToken } from "./lib/api";
import type { FailedQueueItem } from "./lib/storage";

/** 配置页状态 */
type OptionsState = {
  token: string;
  tokenVisible: boolean;
  verifyingToken: boolean;
  tokenValid: boolean | null;
  queueItems: FailedQueueItem[];
  status: "idle" | "verifying" | "success" | "error";
  message: string;
};

const state: OptionsState = {
  token: "",
  tokenVisible: false,
  verifyingToken: false,
  tokenValid: null,
  queueItems: [],
  status: "idle",
  message: "",
};

/** SVG 图标集合 */
const ICONS = {
  loader: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
};

/**
 * 初始化配置页
 *
 * @description 从存储读取 Token 与失败队列，渲染页面
 */
async function init(): Promise<void> {
  state.token = await storage.getToken();
  state.queueItems = await storage.getFailedQueue();
  render();

  // 已配置 Token 时静默校验
  if (state.token) {
    await verifyAndRender();
  }

  // 支持 #queue 锚点滚动定位
  if (window.location.hash === "#queue") {
    document.getElementById("queue")?.scrollIntoView({ behavior: "smooth" });
  }
}

/**
 * 保存 Token
 *
 * @description 写入存储后自动校验并更新状态
 */
async function handleSaveToken(): Promise<void> {
  const token = state.token.trim();
  if (!token) {
    setStatus("error", "请先填写 API Token");
    return;
  }

  await storage.setToken(token);
  state.token = token;
  state.verifyingToken = true;
  state.status = "verifying";
  state.message = "Token 已保存，正在校验";
  render();

  await verifyAndRender();
}

/**
 * 校验 Token 并渲染结果
 *
 * @description 调用 verifyToken，更新 tokenValid 与状态
 */
async function verifyAndRender(): Promise<void> {
  try {
    await verifyToken(state.token);
    state.tokenValid = true;
    state.verifyingToken = false;
    setStatus("success", "Token 有效，已连接");
  } catch (error) {
    state.tokenValid = error instanceof AuthError ? false : null;
    state.verifyingToken = false;
    setStatus(
      error instanceof AuthError ? "error" : "error",
      error instanceof AuthError ? "Token 无效或已撤销" : "校验失败，请检查网络",
    );
  }
}

/**
 * 单条重试
 *
 * @description 对指定载荷重试，成功后刷新队列
 */
async function handleRetryOne(payload: { url: string }): Promise<void> {
  await queue.retryOne(payload);
  state.queueItems = await storage.getFailedQueue();
  render();
}

/**
 * 全部重试
 *
 * @description 调用 flush 刷新所有失败项
 */
async function handleRetryAll(): Promise<void> {
  await queue.flush();
  state.queueItems = await storage.getFailedQueue();
  render();
}

/**
 * 清空队列
 *
 * @description 清空 failedQueue 并刷新
 */
async function handleClearAll(): Promise<void> {
  await queue.clearAll();
  state.queueItems = await storage.getFailedQueue();
  render();
}

/**
 * 设置状态并渲染
 *
 * @param status - 状态类型
 * @param message - 提示文案
 */
function setStatus(status: OptionsState["status"], message: string): void {
  state.status = status;
  state.message = message;
  render();
}

/** 状态条对应的图标 */
function statusIcon(status: OptionsState["status"]): string {
  switch (status) {
    case "success":
      return ICONS.check;
    default:
      return ICONS.alert;
  }
}

/** 格式化时间为简短显示 */
function formatTime(ts: number): string {
  const date = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 转义 HTML 防止特殊字符破坏模板 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 渲染配置页 UI
 *
 * @description 渲染头部、Token 配置区、失败队列区
 */
function render(): void {
  const root = document.getElementById("root");
  if (!root) return;

  const verifying = state.verifyingToken;
  const hasToken = state.token.trim().length > 0;
  const connClass = !hasToken ? "" : state.tokenValid === false ? "invalid" : "on";
  const connLabel = !hasToken ? "未配置" : state.tokenValid === false ? "Token 无效" : "已连接";
  const showStatus = !!state.message && state.status !== "idle";
  const statusCls = verifying ? "verifying" : state.status;
  const statusMsg = verifying ? "校验中…" : state.message;
  const statusIco = verifying ? ICONS.loader : (showStatus ? statusIcon(state.status) : "");
  const queueCount = state.queueItems.length;

  root.innerHTML = `
    <div class="container">
      <div class="card">
        <div class="card-header">
          <div class="logo"><img src="icons/logo-48.png" alt="Bookmark Lite" /></div>
          <h1>Bookmark Lite 设置</h1>
          <span class="conn ${connClass}">
            <span class="dot"></span>${connLabel}
          </span>
        </div>

        <div class="section-title">API Token</div>
        <div class="field">
          <span class="label">访问令牌</span>
          <div class="token-row">
            <div class="input-wrap">
              <input id="token-input" type="${state.tokenVisible ? "text" : "password"}"
                value="${escapeHtml(state.token)}" placeholder="粘贴 Token 明文" class="token-input" />
              <button id="toggle-eye" class="eye" title="显示/隐藏">
                ${state.tokenVisible ? ICONS.eyeOff : ICONS.eye}
              </button>
            </div>
            <button id="save-token" class="btn-primary" ${verifying ? "disabled" : ""}>
              ${verifying ? `<span class="spin">${ICONS.loader}</span>校验中` : "保存"}
            </button>
          </div>
          <div class="status ${showStatus || verifying ? statusCls : "empty"}">
            ${showStatus || verifying ? `<span class="${verifying ? "spin" : ""}">${statusIco}</span><span>${statusMsg}</span>` : ""}
          </div>
        </div>
      </div>

      <div id="queue" class="card">
        <div class="queue-header">
          <div>
            <div class="section-title">失败队列</div>
            <div class="queue-count">${queueCount} 条待重试</div>
          </div>
          ${
            queueCount > 0
              ? `<div class="queue-actions">
                  <button id="retry-all" class="btn-ghost">
                    ${ICONS.refresh}<span>全部重试</span>
                  </button>
                  <button id="clear-all" class="btn-ghost">
                    ${ICONS.trash}<span>清空</span>
                  </button>
                </div>`
              : ""
          }
        </div>

        ${
          queueCount === 0
            ? `<div class="queue-empty">暂无失败书签</div>`
            : `<div class="queue-list">
                ${state.queueItems
                  .map(
                    (item) => `
                  <div class="queue-item">
                    <div class="queue-item-title">${escapeHtml(item.payload.title)}</div>
                    <div class="queue-item-url">${escapeHtml(item.payload.url)}</div>
                    <div class="queue-item-meta">
                      <span class="queue-item-info">重试 ${item.retryCount}/${storage.MAX_RETRY_COUNT} · ${formatTime(item.addedAt)}</span>
                      <button class="btn-ghost retry-one" data-url="${escapeHtml(item.payload.url)}">重试</button>
                    </div>
                  </div>`,
                  )
                  .join("")}
              </div>`
        }
      </div>

      <div class="footer">Bookmark Lite Extension</div>
    </div>
  `;

  document.getElementById("token-input")?.addEventListener("input", (e) => {
    state.token = (e.target as HTMLInputElement).value;
  });
  document.getElementById("save-token")?.addEventListener("click", handleSaveToken);
  document.getElementById("toggle-eye")?.addEventListener("click", () => {
    state.tokenVisible = !state.tokenVisible;
    render();
  });
  document.getElementById("retry-all")?.addEventListener("click", handleRetryAll);
  document.getElementById("clear-all")?.addEventListener("click", handleClearAll);
  document.querySelectorAll<HTMLButtonElement>(".retry-one").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.dataset.url;
      if (url) {
        void handleRetryOne({ url });
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
