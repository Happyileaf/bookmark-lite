import type { DataScope } from "@prisma/client";
import { Palette, Save, ShieldCheck, Trash2 } from "lucide-react";
import { updateSettingsAction } from "@/actions/settings.actions";
import type { SessionUser } from "@/server/auth/session";
import { settingsService } from "@/server/services/settings.service";

type Props = {
  scope: DataScope;
  user: SessionUser | null;
};

export async function SettingsView({ scope, user }: Props) {
  const settings = await settingsService.get(scope, user);
  const scopeLabel = scope === "APP" ? "全局设置" : "个人设置";

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900">{scopeLabel}</h1>
        <p className="text-sm text-slate-600">
          调整主题和数据保留策略，保存后立即生效。
        </p>
      </header>

      <form
        action={updateSettingsAction.bind(null, scope)}
        className="overflow-hidden rounded border border-slate-200 bg-white"
      >
        <div className="space-y-0 divide-y divide-slate-100">
          <div className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                <Palette className="h-4 w-4 text-slate-500" />
                <label htmlFor="theme">主题</label>
              </div>
              <p className="text-xs text-slate-500">可选择浅色、深色或自动跟随系统。</p>
            </div>
            <select
              id="theme"
              name="theme"
              defaultValue={settings.theme}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="system">跟随系统</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </div>

          <div className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                <Trash2 className="h-4 w-4 text-slate-500" />
                <label htmlFor="trashRetentionDays">回收站保留天数</label>
              </div>
              <p className="text-xs text-slate-500">超过保留期的回收站数据将自动清理。</p>
            </div>
            <select
              id="trashRetentionDays"
              name="trashRetentionDays"
              defaultValue={settings.trashRetentionDays}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value={7}>7 天</option>
              <option value={30}>30 天</option>
              <option value={90}>90 天</option>
              <option value={3650}>永久保留</option>
            </select>
          </div>

          <div className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                <ShieldCheck className="h-4 w-4 text-slate-500" />
                <label htmlFor="auditRetentionDays">审计日志保留天数</label>
              </div>
              <p className="text-xs text-slate-500">
                保留关键操作记录，便于排查和审计。
              </p>
            </div>
            <select
              id="auditRetentionDays"
              name="auditRetentionDays"
              defaultValue={settings.auditRetentionDays}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value={30}>30 天</option>
              <option value={90}>90 天</option>
              <option value={180}>180 天</option>
              <option value={365}>365 天</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-4 py-3">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-800"
          >
            <Save className="h-4 w-4" />
            保存设置
          </button>
        </div>
      </form>
    </section>
  );
}
