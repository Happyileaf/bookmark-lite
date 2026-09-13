import { ShieldAlert } from "lucide-react";
import { ApiTokenSection } from "@/components/settings/api-token-section.client";
import { API_BASE_URL } from "@/lib/site-url";
import type { SessionUser } from "@/server/auth/session";
import { apiTokenService } from "@/server/services/api-token.service";

type Props = {
  user: SessionUser;
};

/**
 * API Token 管理页面视图
 *
 * @description 管理 API Token 的生成、查看与撤销；含安全提示与 REST API 快速开始
 */
export async function ApiTokenView({ user }: Props) {
  const tokens = (await apiTokenService.list(user)).map((t) => ({
    id: t.id,
    name: t.name,
    tokenPrefix: t.tokenPrefix,
    lastUsedAt: t.lastUsedAt ? t.lastUsedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  }));
  const apiBaseUrl = API_BASE_URL.production;

  return (
    <section>
      <header>
        <h1 className="text-[20px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
          API Token
        </h1>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
          用于 MCP 服务与 REST API 调用的访问凭证。
        </p>
      </header>

      <div className="mt-5 flex items-start gap-2.5 rounded-sm border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/50">
        <ShieldAlert className="mt-px h-4 w-4 shrink-0 text-blue-500" />
        <p className="text-[13px] leading-relaxed text-blue-700 dark:text-blue-300">
          Token 仅在创建时完整展示一次，请立即复制并妥善保管。如怀疑泄露，请第一时间撤销并重新生成。
        </p>
      </div>

      <ApiTokenSection tokens={tokens} apiBaseUrl={apiBaseUrl} />
    </section>
  );
}
