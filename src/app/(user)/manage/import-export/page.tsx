import Link from "next/link";
import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { requireSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function UserImportExportPage() {
  await requireSessionUser();
  return (
    <ManageSceneShell scope="USER" current="import-export">
      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <form
            action="/api/import?scope=USER"
            method="post"
            encType="multipart/form-data"
            className="space-y-3 rounded border border-slate-200 bg-white p-4"
          >
            <h2 className="text-sm font-semibold text-slate-800">导入</h2>
            <input
              name="file"
              required
              type="file"
              accept=".html,.htm,.csv,.json"
              className="block w-full text-sm"
            />
            <button
              type="submit"
              className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
            >
              上传并导入
            </button>
          </form>

          <div className="space-y-3 rounded border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-800">导出</h2>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link
                href="/api/export?scope=USER&format=json"
                className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                导出 JSON
              </Link>
              <Link
                href="/api/export?scope=USER&format=csv"
                className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                导出 CSV
              </Link>
              <Link
                href="/api/export?scope=USER&format=html"
                className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                导出 HTML
              </Link>
            </div>
          </div>
        </div>
      </section>
    </ManageSceneShell>
  );
}
