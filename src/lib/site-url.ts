/**
 * 站点基址（按 NODE_ENV 查表）
 *
 * @description 与 extension、mcp-server 保持同名同结构，三端统一。
 * production 指向线上域名，development 指向本地 dev server。
 */
export const API_BASE_URL = {
  production: "https://bookmark-lite.contextlab.top",
  development: "http://localhost:3000",
} as const;

/**
 * 解析当前环境的站点基址
 *
 * @description 按 NODE_ENV 查表，未命中时回退到 development；去除尾部斜杠
 * @returns 站点基址字符串
 */
export function getSiteBaseUrl(): string {
  const nodeEnv = process.env.NODE_ENV;
  const baseUrl =
    (nodeEnv &&
      API_BASE_URL[
        nodeEnv as keyof typeof API_BASE_URL
      ]) ??
    API_BASE_URL.development;
  return baseUrl.replace(/\/+$/, "");
}
