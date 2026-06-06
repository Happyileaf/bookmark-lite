import type { DataScope } from "@prisma/client";
import { Tag as TagIcon } from "lucide-react";
import { deleteTagAction, upsertTagAction } from "@/actions/tag.actions";
import { CreateTagModal } from "@/components/tag/create-tag-modal";
import { EditTagModal } from "@/components/tag/edit-tag-modal";
import type { SessionUser } from "@/server/auth/session";
import { tagService } from "@/server/services/tag.service";

type Props = {
  scope: DataScope;
  user: SessionUser | null;
};

export async function ManageTagsView({ scope, user }: Props) {
  const tags = await tagService.list(scope, user);

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-slate-900">标签管理</h1>
          <p className="text-sm text-slate-600">维护标签结构，便于后续按主题组织书签。</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
            共 {tags.length} 个标签
          </span>
          <CreateTagModal action={upsertTagAction.bind(null, scope)} />
        </div>
      </header>

      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
              <th className="min-w-56 px-3 py-2 font-medium">标签名</th>
              <th className="min-w-72 px-3 py-2 font-medium">描述</th>
              <th className="px-3 py-2 font-medium">书签数</th>
              <th className="min-w-40 px-3 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id} className="border-b border-slate-100 align-top">
                <td className="px-3 py-2 font-medium text-slate-900">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-slate-300"
                      style={{ backgroundColor: tag.color ?? "#cbd5e1" }}
                    />
                    {tag.name}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-600">{tag.description ?? "暂无描述"}</td>
                <td className="px-3 py-2 text-slate-600">
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs">{tag.bookmarkCount}</span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <EditTagModal action={upsertTagAction.bind(null, scope)} tag={tag} />
                    <form action={deleteTagAction.bind(null, scope)}>
                      <input type="hidden" name="id" value={tag.id} />
                      <button
                        type="submit"
                        className="whitespace-nowrap rounded border border-rose-300 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                      >
                        删除
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {tags.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <TagIcon className="h-5 w-5 text-slate-400" />
                    <span>暂无标签，先创建一个用于分类书签。</span>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
