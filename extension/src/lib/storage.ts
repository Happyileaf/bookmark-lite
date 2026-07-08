declare const process: {
  env: {
    NODE_ENV: "production" | "development";
  };
};

const SITE_BASE_URL_BY_NODE_ENV = {
  production: "https://bookmark-lite.contextlab.top",
  development: "http://localhost:3000",
} as const;

/** 当前构建环境 */
const NODE_ENV = process.env.NODE_ENV;

/** 平台基址 */
const API_BASE_URL = (SITE_BASE_URL_BY_NODE_ENV[NODE_ENV] ?? SITE_BASE_URL_BY_NODE_ENV.development).replace(/\/+$/, "");

/** 同步开关默认值 */
const DEFAULT_SYNC_ENABLED = true;

/** 失败队列每条最大重试次数 */
const MAX_RETRY_COUNT = 3;

/** 存储键 */
const STORAGE_KEYS = {
  token: "token",
  syncEnabled: "syncEnabled",
  failedQueue: "failedQueue",
} as const;

/** 待推送书签载荷 */
type BookmarkPayload = {
  url: string;
  title: string;
  favicon?: string;
};

/** 失败队列项 */
type FailedQueueItem = {
  payload: BookmarkPayload;
  retryCount: number;
  addedAt: number;
};

/**
 * 读取存储值
 *
 * @param key - 存储键
 * @returns 存储值，不存在则 undefined
 */
async function getStorage<T>(key: string): Promise<T | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key] as T | undefined;
}

/**
 * 写入存储值
 *
 * @param key - 存储键
 * @param value - 存储值
 */
async function setStorage<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export const storage = {
  STORAGE_KEYS,
  MAX_RETRY_COUNT,

  /**
   * 获取平台基址
   *
   * @returns 平台基址
   */
  async getApiBaseUrl(): Promise<string> {
    return API_BASE_URL;
  },

  /**
   * 获取 API Token
   *
   * @returns Token 明文，未配置则空串
   */
  async getToken(): Promise<string> {
    return (await getStorage<string>(STORAGE_KEYS.token)) ?? "";
  },

  /**
   * 设置 API Token
   *
   * @param token - Token 明文
   */
  async setToken(token: string): Promise<void> {
    await setStorage(STORAGE_KEYS.token, token);
  },

  /**
   * 获取同步开关
   *
   * @description 缺省回退到默认开
   * @returns 是否启用被动同步
   */
  async getSyncEnabled(): Promise<boolean> {
    return (await getStorage<boolean>(STORAGE_KEYS.syncEnabled)) ?? DEFAULT_SYNC_ENABLED;
  },

  /**
   * 设置同步开关
   *
   * @param enabled - 是否启用
   */
  async setSyncEnabled(enabled: boolean): Promise<void> {
    await setStorage(STORAGE_KEYS.syncEnabled, enabled);
  },

  /**
   * 获取失败队列
   *
   * @returns 失败队列项数组
   */
  async getFailedQueue(): Promise<FailedQueueItem[]> {
    return (await getStorage<FailedQueueItem[]>(STORAGE_KEYS.failedQueue)) ?? [];
  },

  /**
   * 设置失败队列
   *
   * @param queue - 失败队列项数组
   */
  async setFailedQueue(queue: FailedQueueItem[]): Promise<void> {
    await setStorage(STORAGE_KEYS.failedQueue, queue);
  },
};

export type { BookmarkPayload, FailedQueueItem };
