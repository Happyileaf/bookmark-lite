"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DataScope } from "@prisma/client";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCode,
  FileJson,
  FileSpreadsheet,
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

type PickError = {
  title: string;
  message: string;
};

const IMPORT_FORMATS = ["HTML", "CSV", "JSON"] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_EXTENSION_PATTERN = /\.(html?|csv|json)$/i;

const EXPORT_FORMATS: Array<{
  label: string;
  format: "json" | "csv" | "html";
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { label: "导出 JSON", format: "json", icon: FileJson },
  { label: "导出 CSV", format: "csv", icon: FileSpreadsheet },
  { label: "导出 HTML", format: "html", icon: FileCode },
];

const EXPORT_BUSY_DURATION_MS = 700;

export function ManageImportExportView({ scope }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [pickError, setPickError] = useState<PickError | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [busyFormat, setBusyFormat] = useState<"json" | "csv" | "html" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (busyTimerRef.current) {
        clearTimeout(busyTimerRef.current);
      }
    };
  }, []);

  const resetPickedFile = useCallback(() => {
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFileChange = useCallback(
    (file: File | null) => {
      if (!file) return;
      if (!ALLOWED_EXTENSION_PATTERN.test(file.name)) {
        setPickError({
          title: "导入失败",
          message: "仅支持 HTML / CSV / JSON 格式的书签文件",
        });
        resetPickedFile();
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setPickError({
          title: "导入失败",
          message: "文件超过 5MB 大小限制，请精简后重试",
        });
        resetPickedFile();
        return;
      }
      setPickError(null);
      setFileName(file.name);
    },
    [resetPickedFile],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!fileName || loading) return;
      setLoading(true);
      setResult(null);
      setPickError(null);

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
        resetPickedFile();
      }
    },
    [fileName, loading, resetPickedFile, scope],
  );

  const handleExportBusy = useCallback((format: "json" | "csv" | "html") => {
    setBusyFormat(format);
    if (busyTimerRef.current) {
      clearTimeout(busyTimerRef.current);
    }
    busyTimerRef.current = setTimeout(() => {
      setBusyFormat(null);
      busyTimerRef.current = null;
    }, EXPORT_BUSY_DURATION_MS);
  }, []);

  const handleChooseFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <section className="min-w-0">
      <header>
        <h1 className="text-[20px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
          导入导出
        </h1>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
          在浏览器与 Bookmark Lite 之间迁移你的书签数据。
        </p>
      </header>

      <div className="mt-5 grid items-stretch gap-4 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="flex h-full flex-col rounded-sm border border-border bg-card"
        >
          <div className="flex flex-1 flex-col gap-3.5 p-[18px]">
            <span className="inline-flex w-fit items-center gap-[5px] self-start rounded-full border border-slate-200 bg-white px-[9px] py-[3px] text-[11.5px] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              <Upload className="h-3 w-3" />
              导入文件
            </span>

            <div>
              <h2 className="text-[13.5px] font-semibold text-slate-900 dark:text-slate-100">
                选择要导入的书签文件
              </h2>
              <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">
                支持浏览器导出的 HTML，以及结构化 CSV / JSON 文件。
              </p>
            </div>

            <div
              onClick={handleChooseFile}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              // TODO(ui-upgrade): 拖拽上传逻辑待补，当前拖放仅视觉态
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              className={`cursor-pointer rounded border-[1.5px] border-dashed p-3.5 transition-colors ${
                isDragging
                  ? "border-blue-600 bg-blue-600/5 dark:border-blue-500 dark:bg-blue-500/10"
                  : "border-slate-300 hover:border-blue-600 hover:bg-blue-600/5 dark:border-slate-600 dark:hover:border-blue-500 dark:hover:bg-blue-500/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChooseFile();
                  }}
                  className="h-8 shrink-0 rounded-sm bg-primary px-[13px] text-[12.5px] font-medium text-primary-foreground transition-[filter] hover:brightness-105 dark:bg-primary"
                >
                  选择文件
                </button>
                <span className="truncate text-[12.5px] text-slate-500 dark:text-slate-400">
                  {fileName || "未选择文件"}
                </span>
              </div>
              <input
                ref={fileInputRef}
                name="file"
                required
                type="file"
                accept=".html,.htm,.csv,.json"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </div>

            <div className="-mt-1.5 flex items-center gap-1.5">
              {IMPORT_FORMATS.map((item) => (
                <span
                  key={item}
                  className="rounded-sm bg-muted px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                >
                  {item}
                </span>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || !fileName}
              className="inline-flex h-9 w-full items-center justify-center gap-[7px] rounded-sm bg-primary text-[13px] font-medium text-primary-foreground transition-[filter] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {loading ? "导入中…" : "上传并导入"}
            </button>

            {pickError && <ImportPickErrorDisplay error={pickError} />}
            {result && <ImportResultDisplay result={result} />}
          </div>
        </form>

        <section className="flex h-full flex-col rounded-sm border border-border bg-card">
          <div className="flex flex-1 flex-col gap-3.5 p-[18px]">
            <span className="inline-flex w-fit items-center gap-[5px] self-start rounded-full border border-slate-200 bg-white px-[9px] py-[3px] text-[11.5px] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              <Download className="h-3 w-3" />
              导出文件
            </span>

            <div>
              <h2 className="text-[13.5px] font-semibold text-slate-900 dark:text-slate-100">
                选择导出格式
              </h2>
              <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">
                可导出为通用格式，便于迁移、备份或与其他系统对接。
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              {EXPORT_FORMATS.map((item) => {
                const Icon = item.icon;
                const isBusy = busyFormat === item.format;
                return (
                  <Link
                    key={item.format}
                    href={`/api/export?scope=${scope}&format=${item.format}`}
                    onClick={() => handleExportBusy(item.format)}
                    aria-busy={isBusy}
                    className={`flex items-center gap-[9px] rounded-sm border border-slate-200 px-[11px] py-2 text-left transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-900 ${
                      isBusy ? "pointer-events-none opacity-55" : ""
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-[12.5px] font-medium text-slate-900 dark:text-slate-100">
                      {item.label}
                    </span>
                    {isBusy ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
                    ) : (
                      <Download className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function ImportPickErrorDisplay({ error }: { error: PickError }) {
  return (
    <div className="rounded-sm bg-red-50 px-3 py-2.5 text-[12.5px] leading-relaxed dark:bg-red-700/[0.14]">
      <p className="flex items-center gap-1.5 font-semibold text-red-700 dark:text-red-400">
        <XCircle className="h-3.5 w-3.5" />
        {error.title}
      </p>
      <p className="mt-px text-red-600/90 dark:text-red-400/90">{error.message}</p>
    </div>
  );
}

function ImportResultDisplay({ result }: { result: ImportResult }) {
  if (result.ok && result.data) {
    const { total, success, failed, failures } = result.data;
    const isPartial = failed > 0;
    return (
      <div
        className={`rounded-sm px-3 py-2.5 text-[12.5px] leading-relaxed ${
          isPartial
            ? "bg-amber-50 dark:bg-amber-700/[0.14]"
            : "bg-green-50 dark:bg-green-700/[0.14]"
        }`}
      >
        <div
          className={`flex items-center gap-1.5 font-semibold ${
            isPartial
              ? "text-amber-700 dark:text-amber-400"
              : "text-green-700 dark:text-green-400"
          }`}
        >
          {isPartial ? (
            <AlertTriangle className="h-3.5 w-3.5" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          导入完成
        </div>
        <p
          className={`mt-px ${
            isPartial
              ? "text-amber-600/90 dark:text-amber-400/90"
              : "text-green-600/90 dark:text-green-400/90"
          }`}
        >
          共 {total} 条，成功 {success} 条
          {isPartial && `，失败 ${failed} 条`}
        </p>
        {failures.length > 0 && (
          <details className="mt-2">
            <summary
              className={`cursor-pointer text-xs font-medium ${
                isPartial
                  ? "text-amber-700 hover:underline dark:text-amber-400"
                  : "text-slate-500 hover:underline dark:text-slate-400"
              }`}
            >
              查看失败详情
            </summary>
            <ul className="mt-1 space-y-1">
              {failures.map((failure, index) => (
                <li key={index} className="text-xs">
                  <span className="font-medium">第 {failure.line} 行：</span>
                  {failure.message}
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
      <div className="rounded-sm bg-red-50 px-3 py-2.5 text-[12.5px] leading-relaxed dark:bg-red-700/[0.14]">
        <div className="flex items-center gap-1.5 font-semibold text-red-700 dark:text-red-400">
          <XCircle className="h-3.5 w-3.5" />
          导入失败
        </div>
        <p className="mt-px text-red-600/90 dark:text-red-400/90">{result.error.message}</p>
      </div>
    );
  }

  return null;
}
