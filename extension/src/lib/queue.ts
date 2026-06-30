import { storage } from "./storage";
import { pushBookmark, AuthError } from "./api";
import type { BookmarkPayload, FailedQueueItem } from "./storage";

/**
 * 将载荷加入失败队列
 *
 * @description 网络或服务端错误时入队，等待后续重试
 * @param payload - 书签载荷
 */
async function enqueue(payload: BookmarkPayload): Promise<void> {
  const queue = await storage.getFailedQueue();
  const item: FailedQueueItem = {
    payload,
    retryCount: 0,
    addedAt: Date.now(),
  };
  queue.push(item);
  await storage.setFailedQueue(queue);
  await updateBadge();
}

/**
 * 更新扩展图标角标
 *
 * @description 有失败项时显示数量，否则清除角标
 */
async function updateBadge(): Promise<void> {
  const queue = await storage.getFailedQueue();
  const text = queue.length > 0 ? String(queue.length) : "";
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
}

/**
 * 尝试推送单条载荷，失败时入队或标记失败
 *
 * @description 鉴权失败不入队（不可重试）；其他错误按重试次数入队
 * @param payload - 书签载荷
 * @returns 成功时返回 alreadyExists 标记
 */
async function attemptPush(
  payload: BookmarkPayload,
): Promise<{ alreadyExists: boolean }> {
  try {
    return await pushBookmark(payload);
  } catch (error) {
    if (error instanceof AuthError) {
      // 鉴权错误不重试，直接抛给调用方处理
      throw error;
    }
    // 其他错误入队
    await enqueue(payload);
    throw error;
  }
}

export const queue = {
  /**
   * 推送书签，失败时自动入队
   *
   * @description 主动/被动收藏的统一入口；鉴权失败抛 AuthError
   * @param payload - 书签载荷
   * @returns 成功时返回 alreadyExists 标记
   */
  async push(payload: BookmarkPayload): Promise<{ alreadyExists: boolean }> {
    return attemptPush(payload);
  },

  /**
   * 刷新失败队列
   *
   * @description 在 service worker 启动、书签事件、popup 打开时调用；
   * 对队列中每项尝试重试，成功则移除，失败则递增 retryCount，超限标记失败
   */
  async flush(): Promise<void> {
    const queue = await storage.getFailedQueue();
    if (queue.length === 0) return;

    const remaining: FailedQueueItem[] = [];

    for (const item of queue) {
      try {
        await pushBookmark(item.payload);
        // 成功则跳过（不加入 remaining）
      } catch (error) {
        if (error instanceof AuthError) {
          // 鉴权失败，保留在队列，不递增重试次数（等用户修复 Token）
          remaining.push(item);
          continue;
        }
        // 其他错误：递增重试次数，超限则丢弃（避免无限堆积）
        const nextRetry = item.retryCount + 1;
        if (nextRetry >= storage.MAX_RETRY_COUNT) {
          continue;
        }
        remaining.push({ ...item, retryCount: nextRetry });
      }
    }

    await storage.setFailedQueue(remaining);
    await updateBadge();
  },
};
