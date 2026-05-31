import { prisma } from "@/server/db/prisma";
import type { DataScope, Role } from "@prisma/client";

type AuditInput = {
  userId?: string | null;
  role?: Role | null;
  action: string;
  targetType: string;
  targetId: string;
  scope?: DataScope | null;
  status: "SUCCESS" | "DENY" | "FAIL";
  reason?: string;
  ip?: string | null;
  userAgent?: string | null;
};

export const auditRepo = {
  async create(input: AuditInput) {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        role: input.role ?? null,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        scope: input.scope ?? null,
        status: input.status,
        reason: input.reason,
        ip: input.ip,
        userAgent: input.userAgent,
      },
    });
  },
};
