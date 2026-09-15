import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { ManageUsersView } from "@/components/user/manage-users-view";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";
import { requireSuperAdmin } from "@/server/auth/session";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * 读取查询参数的首个字符串值
 *
 * @description 兼容重复参数（数组）场景，取首个元素；缺省返回空串
 * @param value - 原始查询参数值
 * @returns 归一化后的字符串
 */
function readParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/**
 * 解析正整数查询参数
 *
 * @description 非法或小于 1 时回退到默认值；结果不超过上限
 * @param value - 原始查询参数值
 * @param fallback - 解析失败时的默认值
 * @param max - 允许的最大值
 * @returns 归一化后的正整数
 */
function readPositiveInt(
  value: string | string[] | undefined,
  fallback: number,
  max: number,
): number {
  const parsed = Number.parseInt(readParam(value), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
}

export default async function AdminManageUsersPage({
  searchParams,
}: PageProps) {
  const [params, user] = await Promise.all([searchParams, requireSuperAdmin()]);

  const roleParam = readParam(params.role);
  const role =
    roleParam === "user" || roleParam === "super_admin" ? roleParam : undefined;
  const sortParam = readParam(params.sort);
  const sort =
    sortParam === "created_asc" || sortParam === "email_asc"
      ? sortParam
      : "created_desc";

  return (
    <ManageSceneShell scope="APP" current="users">
      <ManageUsersView
        user={user}
        q={readParam(params.q).trim()}
        role={role}
        sort={sort}
        page={readPositiveInt(params.page, 1, Number.MAX_SAFE_INTEGER)}
        pageSize={readPositiveInt(params.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)}
      />
    </ManageSceneShell>
  );
}
