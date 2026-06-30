import { storage } from "./storage";
import type { BookmarkPayload } from "./storage";

/** 接口响应 */
type CreateBookmarkResponse = {
  ok: boolean;
  data?: { id?: string; alreadyExists?: boolean };
  error?: { code?: string; message?: string };
};

/** 鉴权失败标记，用于区分是否应重试 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * 推送书签到平台
 *
 * @description 调用 POST /api/extension/bookmarks，Bearer Token 鉴权
 * @param payload - 书签载荷
 * @returns 成功时返回 alreadyExists 标记
 * @throws {AuthError} Token 无效或缺失（不应重试）
 * @throws {Error} 网络或服务端错误（应入队重试）
 * @example
 * const { alreadyExists } = await pushBookmark({ url, title });
 */
export async function pushBookmark(
  payload: BookmarkPayload,
): Promise<{ alreadyExists: boolean }> {
  const apiBaseUrl = await storage.getApiBaseUrl();
  const token = await storage.getToken();

  if (!token) {
    throw new AuthError("未配置 API Token");
  }

  const response = await fetch(`${apiBaseUrl}/api/extension/bookmarks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new AuthError("Token 无效或已撤销");
  }

  // 鉴权通过但服务端异常：作为可重试错误抛出
  if (!response.ok) {
    throw new Error(`服务端错误：${response.status}`);
  }

  const json: CreateBookmarkResponse = await response.json();
  if (!json.ok) {
    throw new Error(json.error?.message ?? "未知错误");
  }

  return { alreadyExists: json.data?.alreadyExists === true };
}

/**
 * 校验 Token 有效性
 *
 * @description 调用 GET /api/extension/verify，用于保存 Token 前验证；
 * 接受待校验的 Token 明文（此时可能尚未写入存储）
 * @param token - 待校验的 Token 明文
 * @returns 有效返回 true
 * @throws {AuthError} Token 无效或缺失
 * @throws {Error} 网络或服务端错误
 * @example
 * await verifyToken("blt_xxxx");
 */
export async function verifyToken(token: string): Promise<boolean> {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new AuthError("请填写 API Token");
  }

  const apiBaseUrl = await storage.getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/extension/verify`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${trimmed}`,
    },
  });

  if (response.status === 401) {
    throw new AuthError("Token 无效或已撤销");
  }

  if (!response.ok) {
    throw new Error(`服务端错误：${response.status}`);
  }

  return true;
}
