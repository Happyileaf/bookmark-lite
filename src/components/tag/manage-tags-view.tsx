import type { DataScope } from "@prisma/client";
import { deleteTagAction, upsertTagAction } from "@/actions/tag.actions";
import { CreateTagModal } from "@/components/tag/create-tag-modal";
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
      <header className="flex h-[50px] items-center justify-between">
        <h1 className="text-xl leading-none font-semibold text-slate-900">标签管理</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">共 {tags.length} 个标签</span>
          <CreateTagModal action={upsertTagAction.bind(null, scope)} />
        </div>
      </header>

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
