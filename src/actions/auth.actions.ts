"use server";

import { hashPassword } from "@/server/auth/password";
import { passwordResetService } from "@/server/services/password-reset.service";
import { isAppError } from "@/server/types/errors";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const registerSchema = z
  .object({
    email: z.string().trim().email("请输入正确的邮箱"),
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

export async function registerAction(
  _prevState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
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

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, message: "邮箱已注册，请直接登录" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "user",
    },
  });

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

  const resetBaseUrl = resolveResetBaseUrl();

  try {
    await passwordResetService.requestReset(parsed.data.email, resetBaseUrl);
  } catch (error) {
    console.error("[password-reset] 请求重置失败:", error);
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

const RESET_BASE_URL_BY_NODE_ENV = {
  production: "https://bookmark-lite.contextlab.top",
  development: "http://localhost:3000",
} as const;

function resolveResetBaseUrl(): string {
  const nodeEnv = process.env.NODE_ENV;
  const baseUrl =
    (nodeEnv && RESET_BASE_URL_BY_NODE_ENV[nodeEnv as keyof typeof RESET_BASE_URL_BY_NODE_ENV]) ??
    RESET_BASE_URL_BY_NODE_ENV.development;
  return baseUrl.replace(/\/+$/, "");
}
