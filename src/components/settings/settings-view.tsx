import type { DataScope } from "@prisma/client";
import { updateSettingsAction } from "@/actions/settings.actions";
import type { SessionUser } from "@/server/auth/session";
import { settingsService } from "@/server/services/settings.service";

type Props = {
  scope: DataScope;
  user: SessionUser | null;
};

export async function SettingsView({ scope, user }: Props) {
  const settings = await settingsService.get(scope, user);

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">
        {scope === "APP" ? "应用设置" : "个人设置"}
      </h1>

      <form
        action={updateSettingsAction.bind(null, scope)}
        className="grid gap-4 rounded border border-slate-200 bg-white p-4"
      >
        <label className="space-y-1 text-sm">
          <span className="text-slate-700">主题</span>
          <select
            name="theme"
            defaultValue={settings.theme}
            className="w-full rounded border border-slate-300 px-3 py-2"
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-slate-700">回收站保留天数</span>
          <select
            name="trashRetentionDays"
            defaultValue={settings.trashRetentionDays}
            className="w-full rounded border border-slate-300 px-3 py-2"
          >
            <option value={7}>7 天</option>
            <option value={30}>30 天</option>
            <option value={90}>90 天</option>
            <option value={3650}>永久保留</option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-slate-700">审计日志保留天数</span>
          <select
            name="auditRetentionDays"
            defaultValue={settings.auditRetentionDays}
            className="w-full rounded border border-slate-300 px-3 py-2"
          >
            <option value={30}>30 天</option>
            <option value={90}>90 天</option>
            <option value={180}>180 天</option>
            <option value={365}>365 天</option>
          </select>
        </label>

        <button
          type="submit"
          className="w-fit rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
        >
          保存设置
        </button>
      </form>
    </section>
  );
}
