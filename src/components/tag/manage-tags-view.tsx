import type { DataScope } from "@prisma/client";
import { deleteTagAction, upsertTagAction } from "@/actions/tag.actions";
import type { SessionUser } from "@/server/auth/session";
import { tagService } from "@/server/services/tag.service";

type Props = {
  scope: DataScope;
  user: SessionUser | null;
};

export async function ManageTagsView({ scope, user }: Props) {
  const tags = await tagService.list(scope, user);

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          {scope === "APP" ? "应用标签管理" : "个人标签管理"}
        </h1>
        <span className="text-xs text-slate-500">共 {tags.length} 个标签</span>
      </header>

      <form
        action={upsertTagAction.bind(null, scope)}
        className="grid gap-2 rounded border border-slate-200 bg-white p-3 md:grid-cols-3"
      >
        <input
          name="name"
          required
          placeholder="标签名称"
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="color"
          placeholder="#94a3b8"
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="description"
          placeholder="标签描述（可选）"
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="md:col-span-3">
          <button
            type="submit"
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
          >
            新建标签
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
              <th className="px-3 py-2 font-medium">标签名</th>
              <th className="px-3 py-2 font-medium">描述</th>
              <th className="px-3 py-2 font-medium">书签数</th>
              <th className="px-3 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id} className="border-b border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-900">{tag.name}</td>
                <td className="px-3 py-2 text-slate-600">{tag.description ?? "-"}</td>
                <td className="px-3 py-2 text-slate-600">{tag.bookmarkCount}</td>
                <td className="px-3 py-2">
                  <form action={deleteTagAction.bind(null, scope)}>
                    <input type="hidden" name="id" value={tag.id} />
                    <button
                      type="submit"
                      className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      删除
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {tags.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-slate-500">
                  暂无标签
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
