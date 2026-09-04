import { createHmac, randomInt } from "node:crypto";
import { getNextAuthSecret } from "@/server/auth/secret";

/**
 * 生成 6 位数字注册验证码
 *
 * @description 使用密码学安全随机数生成 6 位数字（000000 ~ 999999），返回明文与落库哈希
 * @returns 包含明文验证码与其哈希的对象
 * @example
 * const { raw, codeHash } = generateRegistrationCode("user@example.com");
 */
export function generateRegistrationCode(email: string): {
  raw: string;
  codeHash: string;
} {
  const raw = randomInt(0, 1_000_000).toString().padStart(6, "0");
  return {
    raw,
    codeHash: hashRegistrationCode(email, raw),
  };
}

/**
 * 计算注册验证码的 HMAC-SHA256 哈希
 *
 * @description 验证码熵较低，HMAC 绑定应用密钥与邮箱，可防止哈希被穷举还原，同时避免同一验证码跨邮箱复用
 * @param email - 验证码归属邮箱（归一化后的小写邮箱）
 * @param code - 6 位验证码明文
 * @returns hex 编码的哈希字符串（64 字符）
 */
export function hashRegistrationCode(email: string, code: string): string {
  return createHmac("sha256", getNextAuthSecret())
    .update(`${email}:${code}`)
    .digest("hex");
}
