"use client";

import { Sparkles } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { TagSelectDropdown } from "@/components/tag/tag-select-dropdown";

type BookmarkRow = {
  id: string;
  title: string;
  url: string;
  favicon: string | null;
  description: string | null;
  tags: Array<{ name: string }>;
};

type Props = {
  action: (formData: FormData) => Promise<void>;
  bookmark: BookmarkRow;
  tags: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
};

export function EditBookmarkModal({ action, bookmark, tags }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isParsing, setIsParsing] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState<string>(bookmark.favicon ?? "");
  const titleRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);

  const displayFavicon = faviconUrl || "/logo_assets/logo_export.ico";

  const close = () => {
    setOpen(false);
    setFaviconUrl(bookmark.favicon ?? "");
  };

  const submit = (formData: FormData) => {
    startTransition(async () => {
      await action(formData);
      close();
    });
  };

  type MetadataResult = {
    title: string;
    description: string;
    favicon: string;
  };

  const parseUrl = async () => {
    const url = urlRef.current?.value?.trim();
    if (!url) return;

    setIsParsing(true);
    try {
      const res = await fetch("/api/url-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const payload = await res.json();
      if (res.ok && payload.ok && payload.data) {
        const meta = payload.data as MetadataResult;
        if (titleRef.current && !titleRef.current.value && meta.title) {
          titleRef.current.value = meta.title;
        }
        if (descRef.current && !descRef.current.value && meta.description) {
          descRef.current.value = meta.description;
        }
        if (meta.favicon) {
          setFaviconUrl(meta.favicon);
        }
      }
    } catch {
      // 解析失败静默忽略
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
      >
        编辑
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="关闭弹窗"
            className="absolute inset-0 bg-black/40"
            onClick={close}
          />

          <div className="relative z-10 w-full max-w-2xl rounded border border-slate-200 bg-white shadow-xl dark:border-slate-700/50 dark:bg-slate-800/80">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700/50">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-200">编辑书签</h2>
              <button
                type="button"
                onClick={close}
                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
              >
                关闭
              </button>
            </div>

            <form action={submit} className="flex flex-col gap-2 p-4">
              <input type="hidden" name="id" value={bookmark.id} />

              <div className="flex items-center gap-2">
                <input
                  ref={urlRef}
                  name="url"
                  required
                  defaultValue={bookmark.url}
                  placeholder="https://example.com"
                  className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:placeholder:text-slate-400"
                />
                <button
                  type="button"
                  disabled={isParsing}
                  onClick={parseUrl}
                  title="自动解析标题和描述"
                  className="inline-flex items-center justify-center rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700/40"
                >
                  <Sparkles className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <img
                  src={displayFavicon}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded object-contain"
                />
                <input
                  ref={titleRef}
                  name="title"
                  required
                  defaultValue={bookmark.title}
                  placeholder="书签标题"
                  className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:placeholder:text-slate-400"
                />
                {faviconUrl && <input type="hidden" name="favicon" value={faviconUrl} />}
              </div>
              <input
                ref={descRef}
                name="description"
                defaultValue={bookmark.description ?? ""}
                placeholder="描述（可选）"
                className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:placeholder:text-slate-400"
              />
              <TagSelectDropdown
                options={tags}
                defaultValue={bookmark.tags.map((tag) => tag.name)}
                placeholder="选择一个或多个标签"
              />

              <div className="mt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-600 dark:hover:bg-slate-500"
                >
                  {isPending ? "保存中..." : "保存修改"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
