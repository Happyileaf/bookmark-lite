"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { DataScope } from "@prisma/client";
import {
  CheckCircle2,
  Download,
  FileCode,
  FileSpreadsheet,
  FileText,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";

type Props = {
  scope: DataScope;
};

type ImportResult = {
  ok: boolean;
  data?: {
    total: number;
    success: number;
    failed: number;
    failures: Array<{ line: number; code: string; message: string }>;
  };
  error?: {
    code: string;
    message: string;
  };
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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);
      setResult(null);

      const form = e.currentTarget;
      const formData = new FormData(form);

      try {
        const res = await fetch(`/api/import?scope=${scope}`, {
          method: "POST",
          body: formData,
        });
        const json: ImportResult = await res.json();
        setResult(json);
      } catch {
        setResult({
          ok: false,
          error: { code: "NETWORK_ERROR", message: "网络请求失败，请稍后再试" },
        });
      } finally {
        setLoading(false);
      }
    },
    [scope],
  );

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-200">导入导出</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">在这里批量导入书签，或导出现有数据进行备份。</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded border border-slate-200 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-800/50"
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700/50 dark:text-slate-300">
              <Upload className="h-3.5 w-3.5" />
              导入文件
            </div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-200">选择要导入的书签文件</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              支持浏览器导出的 HTML，以及结构化 CSV / JSON 文件。
            </p>
          </div>

          <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-600/60 dark:bg-slate-700/30">
            <input
              name="file"
              required
              type="file"
              accept=".html,.htm,.csv,.json"
              className="block w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300 dark:file:bg-slate-600 dark:hover:file:bg-slate-500"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {importFormats.map((item) => (
                <span
                  key={item}
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 dark:border-slate-700/50 dark:bg-slate-700/40 dark:text-slate-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {loading ? "导入中..." : "上传并导入"}
          </button>

          {result && (
            <ImportResultDisplay result={result} />
          )}
        </form>

        <section className="space-y-4 rounded border border-slate-200 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700/50 dark:text-slate-300">
              <Download className="h-3.5 w-3.5" />
              导出文件
            </div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-200">选择导出格式</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
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
                  className="inline-flex w-full items-center justify-between rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    {item.label}
                  </span>
                  <Download className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}

function ImportResultDisplay({ result }: { result: ImportResult }) {
  if (result.ok && result.data) {
    const { total, success, failed, failures } = result.data;
    return (
      <div
        className={`rounded border p-3 text-sm ${
          failed > 0
            ? "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200"
            : "border-green-200 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-200"
        }`}
      >
        <div className="mb-1 flex items-center gap-1.5 font-medium">
          {failed > 0 ? (
            <XCircle className="h-4 w-4 text-yellow-500" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          导入完成
        </div>
        <p>
          共 {total} 条，成功 {success} 条
          {failed > 0 && `，失败 ${failed} 条`}
        </p>
        {failures.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-medium text-slate-500 dark:text-slate-400">
              查看失败详情
            </summary>
            <ul className="mt-1 space-y-1">
              {failures.map((f, i) => (
                <li key={i} className="text-xs">
                  <span className="font-medium">第 {f.line} 行：</span>
                  {f.message}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    );
  }

  if (!result.ok && result.error) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
        <div className="mb-1 flex items-center gap-1.5 font-medium">
          <XCircle className="h-4 w-4 text-red-500" />
          导入失败
        </div>
        <p>{result.error.message}</p>
      </div>
    );
  }

  return null;
}
