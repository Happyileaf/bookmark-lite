const DEFAULT_DEV_SECRET = "dev-only-secret-change-me";

const KNOWN_WEAK_SECRETS = new Set([
  DEFAULT_DEV_SECRET,
  "replace-with-a-long-random-secret",
]);

let cachedSecret: string | null = null;

export function getNextAuthSecret(): string {
  if (cachedSecret !== null) {
    return cachedSecret;
  }

  const secret = process.env.NEXTAUTH_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    if (!secret) {
      throw new Error(
        "NEXTAUTH_SECRET 未配置：生产环境必须设置 NEXTAUTH_SECRET，否则 JWT 可被伪造导致认证绕过。",
      );
    }
    if (KNOWN_WEAK_SECRETS.has(secret)) {
      throw new Error(
        "NEXTAUTH_SECRET 不能使用默认或示例占位密钥：请通过 `openssl rand -base64 32` 生成强随机值并配置到环境变量。",
      );
    }
    if (secret.length < 32) {
      throw new Error(
        "NEXTAUTH_SECRET 强度过低：生产环境密钥长度至少 32 字符，请使用强随机值。",
      );
    }
    cachedSecret = secret;
    return cachedSecret;
  }

  if (!secret || KNOWN_WEAK_SECRETS.has(secret)) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[security] NEXTAUTH_SECRET 未配置或使用默认/示例占位密钥，仅允许本地开发使用。生产环境请配置强随机密钥。",
      );
    }
    cachedSecret = secret ?? DEFAULT_DEV_SECRET;
    return cachedSecret;
  }

  cachedSecret = secret;
  return cachedSecret;
}
