import { auth } from "@/server/auth/auth";
import { AppError } from "@/server/types/errors";
import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export type SessionUser = {
  id: string;
  role: Role;
  email?: string | null;
  name?: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return {
    id: session.user.id,
    role: session.user.role,
    email: session.user.email,
    name: session.user.name,
  };
}

/**
 * 获取当前登录用户，未登录时重定向至登录页
 *
 * @description 供页面组件使用；proxy 未拦截的失效会话（如用户被禁用后 JWT 尚未更新的窗口期）在此兜底跳回登录页
 * @returns 当前登录用户信息
 */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireSessionUser();
  if (user.role !== "super_admin") {
    throw new AppError("FORBIDDEN", "无权限访问该资源", 403);
  }
  return user;
}
