import { auth } from "@/server/auth/auth";
import { AppError } from "@/server/types/errors";
import type { Role } from "@prisma/client";

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

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError("AUTH_REQUIRED", "请先登录", 401);
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
