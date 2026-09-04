"use server";

import { registrationService } from "@/server/services/registration.service";
import { passwordResetService } from "@/server/services/password-reset.service";
import { isAppError } from "@/server/types/errors";
import { getSiteBaseUrl } from "@/lib/site-url";
import { z } from "zod";

const sendRegisterCodeSchema = z.object({
  email: z.string().trim().email("请输入正确的邮箱"),
});

export type SendRegisterCodeActionState =
  | {
      ok: false;
      message: string;
    }
  | {
      ok: true;
      message: string;
    }
  | undefined;

/**
 * 发送注册验证码
 *
 * @description 校验邮箱格式后向其发送 6 位注册验证码；服务端限流 60 秒
 * @param _prevState - 前一次状态（useActionState 约定）
 * @param formData - 表单数据，含 email
 * @returns 状态对象
 */
export async function sendRegisterCodeAction(
  _prevState: SendRegisterCodeActionState,
  formData: FormData,
): Promise<SendRegisterCodeActionState> {
  const parsed = sendRegisterCodeSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.flatten().fieldErrors.email?.[0] ?? "请输入正确的邮箱",
    };
  }

  let ttlMinutes: number;
  try {
    ({ ttlMinutes } = await registrationService.sendCode(parsed.data.email));
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    console.error("[registration] 发送验证码失败:", error);
    return { ok: false, message: "发送验证码时出错，请稍后重试" };
  }

  return { ok: true, message: `验证码已发送，请在 ${ttlMinutes} 分钟内完成注册` };
}

const registerSchema = z
  .object({
    email: z.string().trim().email("请输入正确的邮箱"),
    code: z.string().trim().regex(/^\d{6}$/, "请输入 6 位邮箱验证码"),
    password: z.string().min(8, "密码至少 8 位"),
    confirmPassword: z.string().min(8, "确认密码至少 8 位"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "两次输入的密码不一致",
  });

export type RegisterActionState =
  | {
      ok: false;
      message: string;
    }
  | {
      ok: true;
      message: string;
    }
  | undefined;

/**
 * 提交注册
 *
 * @description 校验邮箱、6 位验证码与密码后完成注册；验证码错误或过期均会拒绝注册
 * @param _prevState - 前一次状态（useActionState 约定）
 * @param formData - 表单数据，含 email / code / password / confirmPassword
 * @returns 状态对象
 */
export async function registerAction(
  _prevState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const message =
      parsed.error.flatten().formErrors[0] ??
      Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ??
      "注册参数不合法";
    return { ok: false, message };
  }

  try {
    await registrationService.registerWithCode(
      parsed.data.email,
      parsed.data.code,
      parsed.data.password,
    );
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    console.error("[registration] 注册失败:", error);
    return { ok: false, message: "注册时出错，请稍后重试" };
  }

  return { ok: true, message: "注册成功，请登录" };
}

const requestPasswordResetSchema = z.object({
  email: z.string().trim().email("请输入正确的邮箱"),
});

export type RequestPasswordResetActionState =
  | {
      ok: false;
      message: string;
    }
  | {
      ok: true;
      message: string;
    }
  | undefined;

/**
 * 发起密码重置请求
 *
 * @description 校验邮箱后生成重置令牌并发送邮件；无论邮箱是否注册都返回成功，避免账号枚举
 * @param _prevState - 前一次状态（useActionState 约定）
 * @param formData - 表单数据，含 email
 * @returns 状态对象
 */
export async function requestPasswordResetAction(
  _prevState: RequestPasswordResetActionState,
  formData: FormData,
): Promise<RequestPasswordResetActionState> {
  const parsed = requestPasswordResetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    const message =
      parsed.error.flatten().fieldErrors.email?.[0] ?? "请输入正确的邮箱";
    return { ok: false, message };
  }

  const resetBaseUrl = getSiteBaseUrl();

  try {
    await passwordResetService.requestReset(parsed.data.email, resetBaseUrl);
  } catch (error) {
    if (isAppError(error)) {
      console.error("[password-reset] 请求失败 code=%s: %s", error.code, error.message);
    } else {
      console.error("[password-reset] 请求重置失败:", error);
    }
    return {
      ok: false,
      message: "发送重置邮件时出错，请稍后重试",
    };
  }

  return {
    ok: true,
    message: "如果该邮箱已注册，重置链接已发送至你的邮箱，请在 30 分钟内完成重置。",
  };
}

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "重置链接无效"),
    password: z.string().min(8, "密码至少 8 位"),
    confirmPassword: z.string().min(8, "确认密码至少 8 位"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "两次输入的密码不一致",
  });

export type ResetPasswordActionState =
  | {
      ok: false;
      message: string;
    }
  | {
      ok: true;
      message: string;
    }
  | undefined;

/**
 * 使用令牌重置密码
 *
 * @description 校验令牌与新密码后更新密码，成功后令牌立即失效
 * @param _prevState - 前一次状态（useActionState 约定）
 * @param formData - 表单数据，含 token / password / confirmPassword
 * @returns 状态对象
 */
export async function resetPasswordAction(
  _prevState: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const message =
      parsed.error.flatten().formErrors[0] ??
      Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ??
      "重置参数不合法";
    return { ok: false, message };
  }

  try {
    await passwordResetService.resetPassword(
      parsed.data.token,
      parsed.data.password,
    );
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    console.error("[password-reset] 重置密码失败:", error);
    return { ok: false, message: "重置密码时出错，请稍后重试" };
  }

  return { ok: true, message: "密码已重置，请使用新密码登录。" };
}


