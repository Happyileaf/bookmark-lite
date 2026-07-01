import { storage } from "./lib/storage";
import { queue } from "./lib/queue";
import { AuthError } from "./lib/api";
import type { BookmarkPayload } from "./lib/storage";

/**
 * 从书签节点构造推送载荷
 *
 * @description 浏览器原生书签节点可能缺 title，做回退处理
 * @param node - chrome 书签节点
 * @returns 书签载荷，无 URL 时返回 null
 */
function buildPayloadFromNode(node: chrome.bookmarks.BookmarkTreeNode): BookmarkPayload | null {
  if (!node.url) {
    return null;
  }
  return {
    url: node.url,
    title: node.title || node.url,
  };
}

/**
 * 初始化监听浏览器书签新增事件
 *
 * @description 同步开关为开时，原生新增书签触发推送；失败自动入队
 */
function initBookmarkListener(): void {
  chrome.bookmarks.onCreated.addListener(async (_id, node) => {
    const syncEnabled = await storage.getSyncEnabled();
    if (!syncEnabled) return;

    const payload = buildPayloadFromNode(node);
    if (!payload) return;

    try {
      await queue.push(payload);
    } catch (error) {
      if (error instanceof AuthError) {
        // 鉴权失败：载荷已由 queue 入队，待 Token 修复后 flush 补偿；popup 会展示连接状态
        return;
      }
      // 其他错误已由 queue 内部入队
    }
  });
}

/**
 * service worker 启动入口
 *
 * @description 注册监听器并尝试刷新失败队列
 */
function init(): void {
  initBookmarkListener();
  // 启动时尝试清空失败队列
  void queue.flush();
}

init();
