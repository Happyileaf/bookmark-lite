import { storage } from "./lib/storage";
import { queue } from "./lib/queue";
import { AuthError } from "./lib/api";
import type { BookmarkPayload } from "./lib/storage";

/** 弹窗状态 */
type PopupState = {
  token: string;
  syncEnabled: boolean;
  status: "idle" | "saving" | "success" | "exists" | "error" | "authError" | "noToken";
  message: string;
};

const state: PopupState = {
  token: "",
  syncEnabled: true,
  status: "idle",
  message: "",
};

/**
 * 初始化弹窗状态
 *
 * @description 从存储读取配置并渲染
 */
async function init(): Promise<void> {
  state.token = await storage.getToken();
  state.syncEnabled = await storage.getSyncEnabled();
  render();

  // 打开时尝试刷新失败队列
  void queue.flush();
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
    state.status = "noToken";
    state.message = "请先填写 API Token";
    render();
    return;
  }

  const tab = await getActiveTab();
  if (!tab || !tab.url) {
    state.status = "error";
    state.message = "无法获取当前页信息";
    render();
    return;
  }

  state.status = "saving";
  state.message = "收藏中...";
  render();

  const payload: BookmarkPayload = {
    url: tab.url,
    title: tab.title || tab.url,
    favicon: tab.favIconUrl,
  };

  try {
    const { alreadyExists } = await queue.push(payload);
    if (alreadyExists) {
      state.status = "exists";
      state.message = "已在书签库";
    } else {
      state.status = "success";
      state.message = "已收藏";
    }
  } catch (error) {
    if (error instanceof AuthError) {
      state.status = "authError";
      state.message = "Token 无效，请检查";
    } else {
      state.status = "error";
      state.message = "将稍后重试";
    }
  }
  render();
}

/**
 * 保存 Token
 *
 * @description 写入存储并更新状态
 */
async function handleSaveToken(): Promise<void> {
  await storage.setToken(state.token.trim());
  state.status = "success";
  state.message = "Token 已保存";
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
 * 渲染弹窗 UI
 *
 * @description 根据状态渲染配置区、收藏按钮、状态提示
 */
function render(): void {
  const root = document.getElementById("root");
  if (!root) return;

  const statusColor =
    state.status === "success"
      ? "text-green-600"
      : state.status === "exists"
        ? "text-blue-600"
        : state.status === "error" || state.status === "authError" || state.status === "noToken"
          ? "text-red-600"
          : "text-slate-600";

  root.innerHTML = `
    <div class="space-y-4 p-4" style="width: 320px;">
      <header class="space-y-1">
        <h1 class="text-base font-semibold text-slate-900">Bookmark Lite</h1>
        <p class="text-xs text-slate-500">收藏当前页或自动同步原生书签</p>
      </header>

      <button id="save-current" class="w-full rounded bg-slate-900 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50">
        ${state.status === "saving" ? "收藏中..." : "收藏当前页"}
      </button>

      ${state.message ? `<p class="text-xs ${statusColor}">${state.message}</p>` : ""}

      <div class="space-y-2 border-t border-slate-200 pt-3">
        <label class="text-xs font-medium text-slate-700">API Token</label>
        <div class="flex gap-2">
          <input id="token-input" type="password" value="${escapeHtml(state.token)}" placeholder="粘贴 Token 明文" class="flex-1 rounded border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-slate-500" />
          <button id="save-token" class="rounded bg-slate-200 px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-300">保存</button>
        </div>
      </div>

      <div class="flex items-center justify-between border-t border-slate-200 pt-3">
        <div>
          <p class="text-xs font-medium text-slate-700">被动同步</p>
          <p class="text-xs text-slate-500">原生收藏自动推送</p>
        </div>
        <button id="sync-toggle" class="relative inline-flex h-5 w-9 items-center rounded-full transition ${state.syncEnabled ? "bg-slate-900" : "bg-slate-300"}">
          <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${state.syncEnabled ? "translate-x-4" : "translate-x-1"}"></span>
        </button>
      </div>
    </div>
  `;

  document.getElementById("save-current")?.addEventListener("click", handleSaveCurrent);
  document.getElementById("save-token")?.addEventListener("click", handleSaveToken);
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
