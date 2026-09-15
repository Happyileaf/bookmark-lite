import { prisma } from "@/server/db/prisma";
import type { Prisma, Role } from "@prisma/client";

/** 管理端用户列表排序选项 */
type UserSortOption = "created_desc" | "created_asc" | "email_asc";

/** 管理端用户列表查询入参 */
type ListInput = {
  q?: string;
  role?: Role;
  sort?: UserSortOption;
  page: number;
  pageSize: number;
};

/** 用户安全字段（任何返回都不得包含 passwordHash） */
const userSafeSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  disabledAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

/**
 * 组装用户列表查询条件
 *
 * @description q 命中邮箱/昵称（模糊、忽略大小写）；role 精确筛选；无条件时返回空 where
 * @param input - 查询条件
 * @param input.q - 关键词
 * @param input.role - 角色筛选
 * @returns Prisma 用户查询条件
 * @example
 * const where = buildWhere({ q: "foo", role: "user" });
 */
function buildWhere(input: { q?: string; role?: Role }): Prisma.UserWhereInput {
  const clauses: Prisma.UserWhereInput[] = [];

  const q = input.q?.trim();
  if (q) {
    clauses.push({
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (input.role) {
    clauses.push({ role: input.role });
  }

  return clauses.length > 0 ? { AND: clauses } : {};
}

/**
 * 组装用户列表排序
 *
 * @description 主排序后追加 id 同向排序保证分页稳定；默认创建时间倒序
 * @param sort - 排序选项
 * @returns Prisma 用户排序条件
 * @example
 * const orderBy = buildOrderBy("email_asc");
 */
function buildOrderBy(sort?: UserSortOption): Prisma.UserOrderByWithRelationInput[] {
  switch (sort ?? "created_desc") {
    case "created_asc":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "email_asc":
      return [{ email: "asc" }, { id: "asc" }];
    case "created_desc":
    default:
      return [{ createdAt: "desc" }, { id: "desc" }];
  }
}

export const userRepo = {
  /**
   * 分页查询用户列表（管理端）
   *
   * @description count 与 findMany 放在同一事务保证一致性；附每个用户的书签数；绝不返回 passwordHash
   * @param input - 查询条件与分页参数
   * @returns 用户列表与总数
   * @example
   * const { items, total } = await userRepo.list({ q: "foo", sort: "created_desc", page: 1, pageSize: 30 });
   */
  async list(input: ListInput) {
    const where = buildWhere(input);
    const [total, items] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: buildOrderBy(input.sort),
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        select: {
          ...userSafeSelect,
          _count: { select: { bookmarks: true } },
        },
      }),
    ]);
    return { items, total };
  },

  /**
   * 用户统计（管理端仪表盘）
   *
   * @description 单次事务返回用户总数、超级管理员数、近 7 天新增数、已禁用数
   * @returns 各项统计数据
   * @example
   * const stats = await userRepo.countStats();
   */
  async countStats() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [total, admins, newThisWeek, disabled] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { role: "super_admin" } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { disabledAt: { not: null } } }),
    ]);
    return { total, admins, newThisWeek, disabled };
  },

  /**
   * 按 ID 查询用户（脱敏）
   *
   * @description 仅返回安全字段，用于管理端操作前的存在性校验与状态读取
   * @param id - 用户 ID
   * @returns 命中返回用户安全字段，否则 null
   * @example
   * const target = await userRepo.findById("4f0b2f0a-0000-4000-8000-000000000000");
   */
  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: userSafeSelect,
    });
  },
};
