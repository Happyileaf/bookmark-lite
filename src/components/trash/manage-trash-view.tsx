import type { DataScope } from "@prisma/client";
import {
  clearTrashAction,
  deleteTrashForeverAction,
  restoreTrashAction,
} from "@/actions/trash.actions";
import type { SessionUser } from "@/server/auth/session";
import { trashService } from "@/server/services/trash.service";

type Props = {
  scope: DataScope;
  user: SessionUser | null;
};

type Snapshot = {
  title?: string;
  url?: string;
};

export async function ManageTrashView({ scope, user }: Props) {
  const items = await trashService.list(scope, user);

  return (
    <section className="space-y-4">
      <div className="flex h-[50px] items-center justify-end">
        <form action={clearTrashAction.bind(null, scope)}>
          <button
            type="submit"
            className="h-9 shrink-0 whitespace-nowrap rounded border border-rose-300 px-3 text-sm text-rose-600 hover:bg-rose-50 dark:border-rose-800/60 dark:text-rose-400 dark:hover:bg-rose-900/30"
          >
            清空回收站
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded border border-slate-200 bg-white dark:border-slate-700/50 dark:bg-slate-800/50">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 dark:border-slate-700/50 dark:bg-slate-700/40 dark:text-slate-400">
              <th className="px-3 py-2 font-medium">标题</th>
              <th className="px-3 py-2 font-medium">URL</th>
              <th className="px-3 py-2 font-medium">删除时间</th>
              <th className="px-3 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const snapshot = (item.payload as { bookmark?: Snapshot })?.bookmark ?? {};
              return (
                <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/40">
                  <td className="px-3 py-2 text-slate-900 dark:text-slate-200">{snapshot.title ?? "-"}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{snapshot.url ?? "-"}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                    {new Date(item.deletedAt).toLocaleString("zh-CN")}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <form action={restoreTrashAction.bind(null, scope)}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
                        >
                          恢复
                        </button>
                      </form>
                      <form action={deleteTrashForeverAction.bind(null, scope)}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:border-rose-800/60 dark:text-rose-400 dark:hover:bg-rose-900/30"
                        >
                          永久删除
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-slate-500 dark:text-slate-400">
                  回收站为空
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
