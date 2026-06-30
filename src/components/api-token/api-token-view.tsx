import { ApiTokenSection } from "@/components/settings/api-token-section.client";
import type { SessionUser } from "@/server/auth/session";
import { apiTokenService } from "@/server/services/api-token.service";

type Props = {
  user: SessionUser;
};

/**
 * API Token 管理页面视图
 *
 * @description 管理 API Token 的生成、查看与撤销；附使用场景说明
 */
export async function ApiTokenView({ user }: Props) {
  const tokens = (await apiTokenService.list(user)).map((t) => ({
    id: t.id,
    name: t.name,
    tokenPrefix: t.tokenPrefix,
    lastUsedAt: t.lastUsedAt ? t.lastUsedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-200">API Token</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          生成与管理 API Token，用于浏览器插件等外部客户端调用平台接口。
        </p>
      </header>

      <ApiTokenSection tokens={tokens} />

      <div className="space-y-2 rounded border border-slate-200 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/30">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-200">使用场景</h2>
        <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
          <li>
            <strong className="font-medium text-slate-700 dark:text-slate-300">浏览器插件：</strong>
            在 Token 生成后复制明文，粘贴到 Chrome/Edge 插件设置中，即可启用一键收藏与书签自动同步。
          </li>
        </ul>
        <p className="pt-1 text-xs text-slate-500 dark:text-slate-500">
          明文仅在生成时展示一次，请妥善保存。Token 可随时撤销，撤销后立即失效。
        </p>
      </div>
    </section>
  );
}
