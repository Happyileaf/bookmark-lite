import { PASSWORD_MIN_LENGTH } from "@/lib/constants";

/** 邮箱格式正则：非空 local@domain.tld 结构（与服务端常见实现同口径的宽松校验） */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 校验邮箱格式是否合法
 *
 * @description 先 trim 再匹配 EMAIL_PATTERN，供表单在 blur/submit 时做客户端预校验；
 * 仅拦截明显格式错误，邮箱是否真实存在由服务端判定
 * @param email - 用户输入的邮箱原文
 * @returns 格式合法返回 true，否则返回 false
 * @example
 * if (!isValidEmail(email)) {
 *   setEmailError("请输入有效的邮箱地址");
 * }
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/**
 * 获取密码的字段级错误文案
 *
 * @description 仅校验最小长度（PASSWORD_MIN_LENGTH），与服务端 zod 的 min 规则保持一致；
 * 合法时返回 null 便于直接写入 error state
 * @param password - 用户输入的密码
 * @returns 不合法时返回错误文案，合法时返回 null
 * @example
 * const passwordError = getPasswordError(password);
 * setErrors((prev) => ({ ...prev, password: passwordError ?? undefined }));
 */
export function getPasswordError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `密码至少 ${PASSWORD_MIN_LENGTH} 位`;
  }
  return null;
}
