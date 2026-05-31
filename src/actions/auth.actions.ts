"use server";

import { hashPassword } from "@/server/auth/password";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/types/errors";
import { redirect } from "next/navigation";
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

export async function ensureSuperAdminByEmailAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    throw new AppError("VALIDATION_FAILED", "邮箱不能为空", 422);
  }
  await prisma.user.update({
    where: { email },
    data: { role: "super_admin" },
  });
  redirect("/login");
}
