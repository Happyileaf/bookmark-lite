/**
 * 生成用户头像文案
 *
 * @description 顶栏、下拉菜单、设置页统一的头像文案规则：
 * 优先取昵称的前两个字符；未设置昵称时取邮箱（@ 前的用户名）前两个字母；
 * 两者都取不到时回退为 U；其中字母统一转大写，中文等字符原样保留
 * @param name - 用户昵称（可空）
 * @param email - 用户邮箱（可空）
 * @returns 最多两个字符（字母大写），兜底为 U
 */
export function getUserAvatarLabel(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    const chars = Array.from(trimmedName).slice(0, 2);
    return chars.length === 1 ? chars[0].toUpperCase() : `${chars[0].toUpperCase()}${chars[1]}`;
  }

  const localPart = email?.trim().split("@")[0];
  if (localPart) {
    const letters = localPart.match(/[a-zA-Z]/g);
    if (letters && letters.length >= 2) {
      return letters.slice(0, 2).join("").toUpperCase();
    }
    const chars = Array.from(localPart).slice(0, 2);
    if (chars.length > 0) {
      return chars.length === 1
        ? chars[0].toUpperCase()
        : `${chars[0].toUpperCase()}${chars[1]}`;
    }
  }

  return "U";
}
