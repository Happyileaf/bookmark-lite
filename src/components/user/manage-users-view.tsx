import Link from "next/link";
import {
  Bookmark as BookmarkIcon,
  Clock,
  Inbox,
  Mail,
  Search,
  ShieldCheck,
  User as UserIcon,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";
import { DeleteUserButton } from "@/components/user/delete-user-button";
import { EditUserRoleModal } from "@/components/user/edit-user-role-modal";
import { ResetUserPasswordModal } from "@/components/user/reset-user-password-modal";
import { ToggleUserDisabledButton } from "@/components/user/toggle-user-disabled-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { StatChip } from "@/components/ui/stat-chip";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { getUserAvatarLabel } from "@/lib/user-label";
import type { SessionUser } from "@/server/auth/session";
import { userService } from "@/server/services/user.service";

type Props = {
  user: SessionUser;
  q: string;
  role?: "user" | "super_admin";
  sort: "created_desc" | "created_asc" | "email_asc";
  page: number;
  pageSize: number;
};

const listPath = "/admin/manage/users";

/**
 * 格式化相对时间
 *
 * @description 将日期转换为「刚刚 / N 分钟前 / N 小时前 / N 天前 / N 个月前 / N 年前」
 * @param date - 目标日期
 * @returns 中文相对时间文案
 */
function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} 个月前`;
  return `${Math.floor(months / 12)} 年前`;
}

/**
 * 用户管理视图（管理端）
 *
 * @description 服务端组件：加载统计与分页用户列表，渲染筛选表单、用户行与危险操作入口
 * @param props - 当前会话用户与已归一化的查询条件
 * @returns 用户管理页面主体
 */
export async function ManageUsersView({
  user,
  q,
  role,
  sort,
  page,
  pageSize,
}: Props) {
  const [stats, result] = await Promise.all([
    userService.stats(user),
    userService.listPaged(
      { q: q || undefined, role, sort, page, pageSize },
      user,
    ),
  ]);
  const users = result.items;
  const safePage = Math.min(result.page, result.totalPages);
  const hasFilter = Boolean(q) || Boolean(role);
  const sortQuery = sort !== "created_desc" ? sort : undefined;
  const pageSizeQuery =
    pageSize !== DEFAULT_PAGE_SIZE ? String(pageSize) : undefined;

  return (
    <section className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[20px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
            用户管理
          </h1>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            管理平台用户，控制角色与账号状态。
          </p>
        </div>
      </div>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatChip icon={Users} tint="#2563eb" value={stats.total} label="总用户数" />
        <StatChip icon={ShieldCheck} tint="#8b5cf6" value={stats.admins} label="超级管理员" />
        <StatChip icon={UserPlus} tint="#10b981" value={stats.newThisWeek} label="本周新增" />
        <StatChip icon={UserX} tint="#f43f5e" value={stats.disabled} label="已禁用" />
      </section>

      <form className="mt-4 flex flex-wrap items-center gap-2">
        {pageSizeQuery ? (
          <input type="hidden" name="pageSize" value={pageSize} />
        ) : null}
        <div className="relative min-w-[180px] flex-1">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="搜索邮箱或昵称"
            className="ctl w-full pl-9 pr-3"
            aria-label="搜索用户"
          />
        </div>
        <select
          name="role"
          defaultValue={role ?? ""}
          className="ctl ctl-sel w-[128px] px-2.5 text-slate-600 dark:text-slate-300"
          aria-label="按角色筛选"
        >
          <option value="">全部角色</option>
          <option value="user">普通用户</option>
          <option value="super_admin">超级管理员</option>
        </select>
        <select
          name="sort"
          defaultValue={sort}
          className="ctl ctl-sel w-[140px] px-2.5 text-slate-600 dark:text-slate-300"
          aria-label="排序方式"
        >
          <option value="created_desc">注册时间倒序</option>
          <option value="created_asc">注册时间正序</option>
          <option value="email_asc">邮箱</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Search className="h-4 w-4" />
          搜索
        </button>
        <Link
          href={listPath}
          aria-label="清空搜索条件"
          title="清空搜索条件"
          className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Link>
      </form>

      {users.length > 0 ? (
        <section className="mt-4 flex flex-col gap-2 overflow-x-auto">
          {users.map((item) => {
            const isSelf = item.id === user.id;
            const disabled = Boolean(item.disabledAt);
            const userLabel = item.name ?? item.email ?? "未命名用户";
            return (
              <article
                key={item.id}
                className="flex min-w-[640px] items-center gap-3.5 rounded-sm border border-slate-200 bg-white px-4 py-3 transition-[border-color,box-shadow] duration-150 hover:border-[#2563eb]/40 hover:shadow-[0_6px_16px_-10px_rgba(15,23,42,0.25)] dark:border-slate-700 dark:bg-card dark:hover:border-[#3b82f6]/50 min-[641px]:min-w-[720px] sm:gap-[14px] lg:min-w-[860px]"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[12px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {getUserAvatarLabel(item.name, item.email)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className="truncate text-[13.5px] font-semibold leading-[1.3] tracking-[-0.01em] text-slate-900 dark:text-slate-100">
                        {item.email ?? "未设置邮箱"}
                      </h3>
                      {isSelf ? (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-blue-50 px-[9px] py-0.5 text-[11.5px] text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                          当前用户
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-[12px] leading-snug text-slate-400 dark:text-slate-500">
                      {item.name ?? "未设置昵称"}
                    </p>
                  </div>
                </div>
                {item.role === "super_admin" ? (
                  <span className="inline-flex w-[96px] shrink-0 items-center justify-center gap-1 rounded-full bg-violet-50 px-[9px] py-0.5 text-[11.5px] font-medium text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                    <ShieldCheck className="h-3 w-3" />
                    超级管理员
                  </span>
                ) : (
                  <span className="inline-flex w-[96px] shrink-0 items-center justify-center gap-1 rounded-full bg-slate-100 px-[9px] py-0.5 text-[11.5px] font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <UserIcon className="h-3 w-3" />
                    普通用户
                  </span>
                )}
                <span className="hidden w-[120px] shrink-0 items-center gap-1.5 text-[12.5px] leading-[14px] text-slate-400 dark:text-slate-500 min-[641px]:inline-flex">
                  <BookmarkIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                  <span className="relative top-[0.5px]">{item._count.bookmarks} 条书签</span>
                </span>
                <span
                  className="hidden w-[80px] shrink-0 items-center gap-1 text-xs text-slate-400 lg:inline-flex"
                  title={item.createdAt.toLocaleString("zh-CN")}
                >
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(item.createdAt)}
                </span>
                <span
                  className={`inline-flex w-[68px] shrink-0 items-center justify-center gap-[5px] rounded-full px-[9px] py-0.5 text-[11.5px] ${
                    disabled
                      ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                  }`}
                >
                  <span
                    className={`h-[5px] w-[5px] rounded-full ${disabled ? "bg-rose-500" : "bg-emerald-500"}`}
                  />
                  {disabled ? "已禁用" : "启用"}
                </span>
                <div className="flex w-[126px] shrink-0 items-center justify-end gap-0.5">
          {isSelf ? null : (
                    <>
                      <EditUserRoleModal
                        userId={item.id}
                        userLabel={userLabel}
                        currentRole={item.role}
                      />
                      <ResetUserPasswordModal
                        userId={item.id}
                        userLabel={userLabel}
                      />
                      <ToggleUserDisabledButton
                        userId={item.id}
                        userLabel={userLabel}
                        disabled={disabled}
                      />
                      <DeleteUserButton userId={item.id} userLabel={userLabel} />
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      ) : hasFilter ? (
        <EmptyState
          className="mt-4"
          icon={Inbox}
          title="没有符合条件的用户"
          description="换个关键词或筛选条件试试。"
          action={
            <Link
              href={listPath}
              className="inline-flex h-8 items-center rounded-sm border border-slate-200 px-3.5 text-[13px] text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              清除条件
            </Link>
          }
        />
      ) : (
        <EmptyState
          className="mt-4"
          icon={Inbox}
          title="暂无用户"
          description="当前还没有任何注册用户。"
        />
      )}

      {result.total > 0 ? (
        <Pagination
          page={safePage}
          pageSize={pageSize}
          total={result.total}
          basePath={listPath}
          queryParams={{
            q: q || undefined,
            role,
            sort: sortQuery,
            pageSize: pageSizeQuery,
          }}
          itemName="个用户"
          emptyText="暂无用户"
          className="mt-4"
        />
      ) : null}
    </section>
  );
}
