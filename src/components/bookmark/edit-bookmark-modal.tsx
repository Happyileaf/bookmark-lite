"use client";

import { Loader2, Pencil, Wand2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { TagSelectDropdown } from "@/components/tag/tag-select-dropdown";
import { BookmarkFavicon } from "@/components/bookmark/infinite-bookmarks-grid";
import { Modal } from "@/components/ui";

type BookmarkRow = {
  id: string;
  title: string;
  url: string;
  favicon: string | null;
  description: string | null;
  isFavorite: boolean;
  isVisible: boolean;
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

type MetadataResult = {
  title: string;
  description: string;
  favicon: string;
};

export function EditBookmarkModal({ action, bookmark, tags }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isParsing, setIsParsing] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState<string>(bookmark.favicon ?? "");
  const [title, setTitle] = useState(bookmark.title);
  const urlRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => urlRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [open]);

  const close = () => {
    setOpen(false);
    setFaviconUrl(bookmark.favicon ?? "");
    setTitle(bookmark.title);
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
        setTitle((current) => current || meta.title);
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
        aria-label="编辑书签"
        title="编辑"
        className="icon-btn"
      >
        <Pencil className="h-4 w-4" />
      </button>

      <Modal
        open={open}
        onClose={close}
        title="编辑书签"
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
              form="edit-bookmark-form"
              disabled={isPending}
              className="inline-flex h-9 items-center rounded-sm bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "保存中..." : "保存"}
            </button>
          </>
        }
      >
        <form id="edit-bookmark-form" action={submit} className="space-y-3.5">
          <input type="hidden" name="id" value={bookmark.id} />

          <div>
            <label htmlFor={`edit-bookmark-url-${bookmark.id}`} className="form-label">
              链接地址
            </label>
            <div className="flex items-center gap-2">
              <input
                id={`edit-bookmark-url-${bookmark.id}`}
                ref={urlRef}
                name="url"
                required
                defaultValue={bookmark.url}
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
            <label htmlFor={`edit-bookmark-title-${bookmark.id}`} className="form-label">
              标题
            </label>
            <div className="flex items-center gap-2.5">
              <BookmarkFavicon src={faviconUrl || null} title={title} className="h-7 w-7" />
              <input
                id={`edit-bookmark-title-${bookmark.id}`}
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
            <label htmlFor={`edit-bookmark-description-${bookmark.id}`} className="form-label">
              描述（可选）
            </label>
            <input
              id={`edit-bookmark-description-${bookmark.id}`}
              ref={descRef}
              name="description"
              defaultValue={bookmark.description ?? ""}
              placeholder="一句话描述这个网站"
              className="ctl w-full"
            />
          </div>

          <div>
            <span className="form-label">标签（可多选）</span>
            <TagSelectDropdown
              options={tags}
              defaultValue={bookmark.tags.map((tag) => tag.name)}
              placeholder="点击选择标签"
            />
          </div>

          <div className="flex items-center gap-6 pt-1">
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-foreground">
              <input
                type="checkbox"
                name="isFavorite"
                defaultChecked={bookmark.isFavorite}
                className="h-4 w-4 accent-[#2563eb]"
              />
              加入收藏
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-foreground">
              <input
                type="checkbox"
                name="isVisible"
                defaultChecked={bookmark.isVisible}
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
