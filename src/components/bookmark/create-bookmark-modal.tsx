"use client";

import { Loader2, Plus, Wand2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { TagSelectDropdown } from "@/components/tag/tag-select-dropdown";
import { BookmarkFavicon } from "@/components/bookmark/infinite-bookmarks-grid";
import { Modal } from "@/components/ui";

type Props = {
  action: (formData: FormData) => Promise<void>;
  tags: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
};

type MetadataResult = {
  title: string;
  description: string;
  favicon: string;
};

export function CreateBookmarkModal({ action, tags }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isParsing, setIsParsing] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState<string>("");
  const [title, setTitle] = useState("");
  const urlRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => urlRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [open]);

  const close = () => {
    setOpen(false);
    setFaviconUrl("");
    setTitle("");
  };

  const submit = (formData: FormData) => {
    startTransition(async () => {
      await action(formData);
      close();
    });
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
        if (!title && meta.title) {
          setTitle(meta.title);
        }
        if (descRef.current && !descRef.current.value && meta.description) {
          descRef.current.value = meta.description;
        }
        if (meta.favicon) {
          setFaviconUrl(meta.favicon);
        }
      }
    } catch {
      //
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-3.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Plus className="h-3.5 w-3.5" />
        新增书签
      </button>

      <Modal
        open={open}
        onClose={close}
        title="新增书签"
        width={420}
        footer={
          <>
            <button
              type="button"
              onClick={close}
              className="inline-flex h-9 items-center rounded-sm border border-slate-200 bg-transparent px-4 text-[13px] text-foreground transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              取消
            </button>
            <button
              type="submit"
              form="create-bookmark-form"
              disabled={isPending}
              className="inline-flex h-9 items-center rounded-sm bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "保存中..." : "保存"}
            </button>
          </>
        }
      >
        <form id="create-bookmark-form" action={submit} className="space-y-3.5">
          <div>
            <label htmlFor="create-bookmark-url" className="form-label">
              链接地址
            </label>
            <div className="flex items-center gap-2">
              <input
                id="create-bookmark-url"
                ref={urlRef}
                name="url"
                required
                placeholder="https://"
                className="ctl flex-1"
              />
              <button
                type="button"
                disabled={isParsing}
                onClick={parseUrl}
                title="自动解析标题和描述"
                aria-label="自动解析标题和描述"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-slate-200 bg-white text-slate-600 transition-colors hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-55 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-primary dark:hover:text-primary"
              >
                {isParsing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="create-bookmark-title" className="form-label">
              标题
            </label>
            <div className="flex items-center gap-2.5">
              <BookmarkFavicon src={faviconUrl || null} title={title} className="h-7 w-7" />
              <input
                id="create-bookmark-title"
                name="title"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="例如：OpenAI"
                className="ctl flex-1"
              />
              {faviconUrl ? <input type="hidden" name="favicon" value={faviconUrl} /> : null}
            </div>
          </div>

          <div>
            <label htmlFor="create-bookmark-description" className="form-label">
              描述（可选）
            </label>
            <input
              id="create-bookmark-description"
              ref={descRef}
              name="description"
              placeholder="一句话描述这个网站"
              className="ctl w-full"
            />
          </div>

          <div>
            <span className="form-label">标签（可多选）</span>
            <TagSelectDropdown options={tags} placeholder="点击选择标签" />
          </div>

          <div className="flex items-center gap-6 pt-1">
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-foreground">
              <input type="checkbox" name="isFavorite" className="h-4 w-4 accent-[#2563eb]" />
              加入收藏
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-foreground">
              <input
                type="checkbox"
                name="isVisible"
                defaultChecked
                className="h-4 w-4 accent-[#2563eb]"
              />
              公开可见
            </label>
          </div>
        </form>
      </Modal>
    </>
  );
}
