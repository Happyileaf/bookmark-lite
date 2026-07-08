import { Resend } from "resend";

const DEFAULT_FROM_ADDRESS = "Bookmark Lite <noreply@resend.dev>";

let cachedClient: Resend | null | undefined = undefined;

/**
 * 获取 Resend 客户端
 *
 * @description 未配置 API Key 时返回 null，调用方据此走开发态兜底
 * @returns Resend 客户端实例；未配置时返回 null
 */
export function getMailClient(): Resend | null {
  if (cachedClient !== undefined) {
    return cachedClient;
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    cachedClient = null;
    return cachedClient;
  }
  cachedClient = new Resend(apiKey);
  return cachedClient;
}

/**
 * 获取发件人地址
 *
 * @description 优先使用环境变量配置；未配置时使用 Resend 默认测试地址
 * @returns 发件人地址字符串
 */
export function getFromAddress(): string {
  const configured = process.env.MAIL_FROM_ADDRESS;
  if (configured && configured.trim().length > 0) {
    return configured.trim();
  }
  return DEFAULT_FROM_ADDRESS;
}

/**
 * 判断邮件传输是否就绪
 *
 * @description 用于上层在调用前判断是否处于开发态（未配置 API Key）
 * @returns 已配置返回 true
 */
export function isMailConfigured(): boolean {
  return getMailClient() !== null;
}
