import { createHash, randomBytes } from "node:crypto";

/** Token 明文前缀 */
const TOKEN_PREFIX = "linkflow_";

/** tokenPrefix 展示的随机字符位数（仅用于识别，泄露无害） */
const TOKEN_DISPLAY_RANDOM = 12;

/**
 * 生成新的 API Token 明文及其派生信息
 *
 * @description 生成高熵随机 Token，返回明文（仅此一次）与用于落库的哈希、前缀
 * @returns 包含明文、哈希、前缀的对象
 * @example
 * const { raw, tokenHash, tokenPrefix } = generateApiToken();
 */
export function generateApiToken(): {
  raw: string;
  tokenHash: string;
  tokenPrefix: string;
} {
  const raw = TOKEN_PREFIX + randomBytes(32).toString("hex");
  return {
    raw,
    tokenHash: hashApiToken(raw),
    tokenPrefix: raw.slice(0, TOKEN_PREFIX.length + TOKEN_DISPLAY_RANDOM),
  };
}

/**
 * 计算 Token 的 SHA-256 哈希
 *
 * @description Token 为高熵随机串，使用 SHA-256 即可，无需慢哈希
 * @param raw - Token 明文
 * @returns hex 编码的哈希字符串（64 字符）
 * @example
 * const hash = hashApiToken("blt_xxxx");
 */
export function hashApiToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
