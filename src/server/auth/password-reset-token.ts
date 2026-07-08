import { createHash, randomBytes } from "node:crypto";

/**
 * 生成新的密码重置令牌明文及其哈希
 *
 * @description 生成高熵随机令牌，返回明文（仅此一次，用于邮件下发）与用于落库的哈希
 * @returns 包含明文与哈希的对象
 * @example
 * const { raw, tokenHash } = generatePasswordResetToken();
 */
export function generatePasswordResetToken(): {
  raw: string;
  tokenHash: string;
} {
  const raw = randomBytes(32).toString("hex");
  return {
    raw,
    tokenHash: hashPasswordResetToken(raw),
  };
}

/**
 * 计算密码重置令牌的 SHA-256 哈希
 *
 * @description 令牌为高熵随机串，使用 SHA-256 即可，无需慢哈希
 * @param raw - 令牌明文
 * @returns hex 编码的哈希字符串（64 字符）
 */
export function hashPasswordResetToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
