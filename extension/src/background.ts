import { storage } from "./lib/storage";
import { queue } from "./lib/queue";
import { AuthError } from "./lib/api";
import type { BookmarkPayload } from "./lib/storage";

/**
 * 构建书签节点 id -> 节点 的索引
 *
 * @param nodes - chrome 书签树节点数组
 * @returns id 到节点的映射
 */
function buildIdIndex(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
): Map<string, chrome.bookmarks.BookmarkTreeNode> {
  const index = new Map<string, chrome.bookmarks.BookmarkTreeNode>();
  const stack = [...nodes];
  while (stack.length > 0) {
    const node = stack.pop()!;
    index.set(node.id, node);
    if (node.children) {
      stack.push(...node.children);
    }
  }
  return index;
}

/**
 * 解析书签所在的「书签栏根节点之下的顶层第一层文件夹」名称
 *
 * @description 回溯 parentId 链，找到直接挂在书签栏/其他书签根下的那一层文件夹；
 * 直接放根节点或位于更深层时仅取顶层；失败或无顶层文件夹时返回 null
 * @param node - chrome 书签节点
 * @returns 顶层文件夹名，无则返回 null
 */
async function resolveTopFolderTag(
  node: chrome.bookmarks.BookmarkTreeNode,
): Promise<string | null> {
  if (!node.parentId) return null;

  const tree = await chrome.bookmarks.getTree();
  const index = buildIdIndex(tree);

  const chain: chrome.bookmarks.BookmarkTreeNode[] = [];
  let current = index.get(node.parentId);
  while (current) {
    chain.push(current);
    current = current.parentId ? index.get(current.parentId) : undefined;
  }

  const barIdx = chain.findIndex((n) => {
    if (!n.parentId) return false;
    const parent = index.get(n.parentId);
    return !!parent && parent.parentId === undefined;
  });
  if (barIdx <= 0) return null;

  const topFolder = chain[barIdx - 1];
  const name = (topFolder.title || "").trim();
  return name || null;
}

/**
 * 从书签节点构造推送载荷
 *
 * @description 浏览器原生书签节点可能缺 title，做回退处理；
 * 解析顶层第一层文件夹名作为标签，解析失败降级为空数组
 * @param node - chrome 书签节点
 * @returns 书签载荷，无 URL 时返回 null
 */
async function buildPayloadFromNode(
  node: chrome.bookmarks.BookmarkTreeNode,
): Promise<BookmarkPayload | null> {
  if (!node.url) {
    return null;
  }

  let tags: string[] = [];
  try {
    const folderName = await resolveTopFolderTag(node);
    if (folderName) {
      tags = [folderName];
    }
  } catch {
    tags = [];
  }

  return {
    url: node.url,
    title: node.title || node.url,
    tags,
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

    const payload = await buildPayloadFromNode(node);
    if (!payload) return;

    try {
      await queue.push(payload);
    } catch (error) {
      if (error instanceof AuthError) {
        // 鉴权错误静默处理，popup 会展示状态
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
