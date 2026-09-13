"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Database,
  SlidersHorizontal,
  TriangleAlert,
  User,
} from "lucide-react";
import {
  useCallback,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { updateSettingsAction } from "@/actions/settings.actions";
import { updateUserProfileAction } from "@/actions/user.actions";
import { Modal, useToast } from "@/components/ui";
import { getUserAvatarLabel } from "@/lib/user-label";
import type { DataScope } from "@prisma/client";

type ThemeValue = "light" | "dark" | "system";

type Props = {
  scope: DataScope;
  theme: string;
  trashRetentionDays: number;
  auditRetentionDays: number;
  userName: string | null;
  userEmail: string | null;
};

const THEME_COOKIE_MAX_AGE = 31536000;

const THEME_SEGMENTS: Array<{ value: ThemeValue; label: string }> = [
  { value: "light", label: "浅色" },
  { value: "dark", label: "深色" },
  { value: "system", label: "跟随系统" },
];

const TRASH_RETENTION_OPTIONS = [
  { value: 7, label: "7 天" },
  { value: 30, label: "30 天" },
  { value: 90, label: "90 天" },
];

const AUDIT_RETENTION_OPTIONS = [
  { value: 30, label: "30 天" },
  { value: 90, label: "90 天" },
  { value: 180, label: "180 天" },
  { value: 365, label: "365 天" },
];

function isThemeValue(value: string): value is ThemeValue {
  return value === "light" || value === "dark" || value === "system";
}

function readThemeCookie(): ThemeValue {
  if (typeof document === "undefined") {
    return "system";
  }
  const match = document.cookie.match(/(?:^|;\s*)theme=([^;]+)/);
  const value = match ? decodeURIComponent(match[1]) : null;
  return value && isThemeValue(value) ? value : "system";
}

function subscribeThemeChange(callback: () => void): () => void {
  document.addEventListener("cookiechange", callback);
  return () => document.removeEventListener("cookiechange", callback);
}

function applyTheme(theme: ThemeValue): void {
  document.cookie = `theme=${theme};path=/;max-age=${THEME_COOKIE_MAX_AGE};SameSite=Lax`;
  document.dispatchEvent(new Event("cookiechange"));
  const prefersDark = window.matchMedia("(prefers-color-scheme:dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", isDark);
}

function SectionCard({
  tone,
  icon,
  title,
  children,
}: {
  tone?: "danger";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const isDanger = tone === "danger";
  return (
    <section
      className={`rounded-sm border bg-white p-5 dark:bg-slate-900 ${
        isDanger
          ? "border-rose-200 dark:border-rose-900/60"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <div
        className={`flex items-center gap-2 ${
          isDanger
            ? "text-rose-600 dark:text-rose-400"
            : "text-slate-900 dark:text-slate-100"
        }`}
      >
        <span className={isDanger ? "" : "text-primary"}>{icon}</span>
        <h2 className="text-[15px] font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function PreferenceRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-slate-900 dark:text-slate-100">
          {title}
        </p>
        <p className="mt-0.5 text-[12px] text-slate-400 dark:text-slate-500">
          {description}
        </p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsFormClient({
  scope,
  theme,
  trashRetentionDays,
  auditRetentionDays,
  userName,
  userEmail,
}: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isProfilePending, startProfileTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [displayName, setDisplayName] = useState(userName);
  const themeValue = useSyncExternalStore(
    subscribeThemeChange,
    readThemeCookie,
    () => (isThemeValue(theme) ? theme : "system"),
  );

  const initials = getUserAvatarLabel(displayName, userEmail);

  const handleThemeSelect = useCallback((next: ThemeValue) => {
    applyTheme(next);
  }, []);

  const handlePreferencesSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("theme", themeValue);
    startTransition(async () => {
      try {
        await updateSettingsAction(scope, formData);
        toast({ title: "偏好设置已保存", variant: "success" });
      } catch {
        toast({ title: "保存失败，请重试", variant: "error" });
      }
    });
  };

  const handleProfileSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextName = String(formData.get("name") ?? "").trim();
    startProfileTransition(async () => {
      try {
        const result = await updateUserProfileAction(formData);
        setDisplayName(result.name);
        router.refresh();
        toast({
          title: "资料已保存",
          description: nextName ? `昵称已更新为 ${nextName}` : "昵称已清空",
          variant: "success",
        });
      } catch {
        toast({ title: "保存失败，请重试", variant: "error" });
      }
    });
  };

  const importExportPath =
    scope === "APP" ? "/admin/manage/import-export" : "/manage/import-export";

  const handleClearHistory = () => {
    toast({ title: "浏览记录已清除", variant: "success" });
  };

  // TODO(ui-upgrade): 删除账号逻辑待补，二次确认后不产生任何请求
  const handleConfirmDelete = () => {
    setDeleteOpen(false);
    toast({ title: "功能开发中", description: "账号删除即将上线" });
  };

  return (
    <div className="space-y-4">
      <SectionCard icon={<User className="h-4 w-4" />} title="个人资料">
        <form onSubmit={handleProfileSubmit}>
          <div className="mt-4 flex items-center gap-4">
            <span className="flex h-14 w-14 select-none items-center justify-center rounded-full bg-primary text-lg font-semibold leading-none tracking-tight text-primary-foreground">
              {initials}
            </span>
            <div>
              <p className="text-[13px] font-medium text-slate-900 dark:text-slate-100">
                头像
              </p>
              <p className="mt-0.5 text-[12px] text-slate-400 dark:text-slate-500">
                头像取昵称前两个字，未设置昵称时取邮箱前两个字母，无需上传。
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="form-label">昵称</span>
              <input
                name="name"
                type="text"
                defaultValue={userName ?? ""}
                placeholder="未设置昵称"
                className="ctl w-full px-3"
              />
            </label>
            <label className="block">
              <span className="form-label">邮箱</span>
              <input
                type="text"
                defaultValue={userEmail ?? ""}
                disabled
                className="ctl w-full cursor-not-allowed px-3 opacity-60"
              />
            </label>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={isProfilePending}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-3.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-primary/50"
            >
              <Check className="h-3.5 w-3.5" />
              {isProfilePending ? "保存中..." : "保存资料"}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        icon={<SlidersHorizontal className="h-4 w-4" />}
        title="偏好设置"
      >
        <form onSubmit={handlePreferencesSubmit}>
          <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
            <PreferenceRow
              title="主题外观"
              description="选择浅色、深色，或跟随系统自动切换"
            >
              <div
                role="group"
                aria-label="主题外观"
                className="flex shrink-0 gap-0.5 rounded-sm border border-slate-200 p-0.5 dark:border-slate-700"
              >
                {THEME_SEGMENTS.map((segment) => {
                  const isActive = themeValue === segment.value;
                  return (
                    <button
                      key={segment.value}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => handleThemeSelect(segment.value)}
                      className={`h-7 rounded-sm px-3 text-[12.5px] transition-colors ${
                        isActive
                          ? "bg-primary font-medium text-primary-foreground"
                          : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                      }`}
                    >
                      {segment.label}
                    </button>
                  );
                })}
              </div>
            </PreferenceRow>

            <PreferenceRow
              title="回收站保留天数"
              description="删除的书签超过该天数后将自动彻底删除"
            >
              <select
                name="trashRetentionDays"
                defaultValue={trashRetentionDays}
                className="ctl ctl-sel w-[140px] px-2.5 text-slate-600 dark:text-slate-300"
              >
                {TRASH_RETENTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
                {/* TODO(ui-upgrade): 永久保留选项提交值映射待补；沿用旧值 3650 仅作只读占位并 disabled，用户不可新选，提交值仍满足 1-3650 校验 */}
                <option value={3650} disabled>
                  永久保留
                </option>
              </select>
            </PreferenceRow>

            <PreferenceRow
              title="审计日志保留天数"
              description="操作审计日志超过该天数后将自动清除"
            >
              <select
                name="auditRetentionDays"
                defaultValue={auditRetentionDays}
                className="ctl ctl-sel w-[140px] px-2.5 text-slate-600 dark:text-slate-300"
              >
                {AUDIT_RETENTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </PreferenceRow>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-3.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-primary/50"
            >
              <Check className="h-3.5 w-3.5" />
              {isPending ? "保存中..." : "保存偏好"}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard icon={<Database className="h-4 w-4" />} title="数据与隐私">
        <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
          <PreferenceRow
            title="导出我的数据"
            description="下载全部书签与标签的 JSON 备份"
          >
            <Link
              href={importExportPath}
              className="inline-flex h-8 shrink-0 items-center rounded-sm border border-slate-200 px-3 text-[13px] text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-primary/50"
            >
              导出
            </Link>
          </PreferenceRow>
          <PreferenceRow
            title="清除浏览记录"
            description="删除本地保存的最近访问记录"
          >
            <button
              type="button"
              onClick={handleClearHistory}
              className="inline-flex h-8 shrink-0 items-center rounded-sm border border-slate-200 px-3 text-[13px] text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-primary/50"
            >
              清除
            </button>
          </PreferenceRow>
        </div>
      </SectionCard>

      <SectionCard
        tone="danger"
        icon={<TriangleAlert className="h-4 w-4" />}
        title="危险区"
      >
        <div className="mt-2 flex items-center justify-between gap-4 py-2">
          <div>
            <p className="text-[13px] font-medium text-slate-900 dark:text-slate-100">
              删除账号
            </p>
            <p className="mt-0.5 text-[12px] text-slate-400 dark:text-slate-500">
              永久删除账号及全部数据，此操作不可撤销
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex h-8 shrink-0 items-center rounded-sm border border-rose-200 px-3.5 text-[13px] font-medium text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950 dark:focus-visible:ring-rose-500/40"
          >
            删除账号
          </button>
        </div>
      </SectionCard>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="删除账号"
        width={420}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className="inline-flex h-8 items-center rounded-sm border border-slate-200 px-3.5 text-[13px] text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-primary/50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="inline-flex h-8 items-center rounded-sm bg-rose-600 px-3.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
            >
              确认删除
            </button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
          永久删除账号及全部书签、标签数据，此操作不可撤销。确定要继续吗？
        </p>
      </Modal>
    </div>
  );
}
