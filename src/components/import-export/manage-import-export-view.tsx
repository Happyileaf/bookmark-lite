import Link from "next/link";
import type { DataScope } from "@prisma/client";
import { Download, FileCode, FileSpreadsheet, FileText, Upload } from "lucide-react";

type Props = {
  scope: DataScope;
};

const importFormats = ["HTML", "CSV", "JSON"] as const;

const exportFormats: Array<{
  label: string;
  format: "json" | "csv" | "html";
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { label: "导出 JSON", format: "json", icon: FileCode },
  { label: "导出 CSV", format: "csv", icon: FileSpreadsheet },
  { label: "导出 HTML", format: "html", icon: FileText },
];

export function ManageImportExportView({ scope }: Props) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900">导入导出</h1>
        <p className="text-sm text-slate-600">在这里批量导入书签，或导出现有数据进行备份。</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <form
          action={`/api/import?scope=${scope}`}
          method="post"
          encType="multipart/form-data"
          className="space-y-4 rounded border border-slate-200 bg-white p-4"
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              <Upload className="h-3.5 w-3.5" />
              导入文件
            </div>
            <h2 className="text-sm font-semibold text-slate-900">选择要导入的书签文件</h2>
            <p className="text-sm text-slate-500">
              支持浏览器导出的 HTML，以及结构化 CSV / JSON 文件。
            </p>
          </div>

          <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4">
            <input
              name="file"
              required
              type="file"
              accept=".html,.htm,.csv,.json"
              className="block w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {importFormats.map((item) => (
                <span
                  key={item}
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-800"
          >
            <Upload className="h-4 w-4" />
            上传并导入
          </button>
        </form>

        <section className="space-y-4 rounded border border-slate-200 bg-white p-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              <Download className="h-3.5 w-3.5" />
              导出文件
            </div>
            <h2 className="text-sm font-semibold text-slate-900">选择导出格式</h2>
            <p className="text-sm text-slate-500">
              可导出为通用格式，便于迁移、备份或与其他系统对接。
            </p>
          </div>

          <div className="space-y-2">
            {exportFormats.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.format}
                  href={`/api/export?scope=${scope}&format=${item.format}`}
                  className="inline-flex w-full items-center justify-between rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-500" />
                    {item.label}
                  </span>
                  <Download className="h-4 w-4 text-slate-400" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}
