"use client";

import { BookmarkPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { TagSelectDropdown } from "@/components/tag/tag-select-dropdown";

type Props = {
  action: (formData: FormData) => Promise<void>;
  bookmarkId: string;
  triggerClassName?: string;
  tags: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
};

export function SaveAppBookmarkModal({ action, bookmarkId, triggerClassName, tags }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = (formData: FormData) => {
    startTransition(async () => {
      await action(formData);
      setOpen(false);
    });
  };

  const modal =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="关闭弹窗"
              className="absolute inset-0 bg-black/35"
              onClick={() => setOpen(false)}
            />

            <div className="relative z-10 w-full max-w-md rounded border border-slate-200 bg-white shadow-xl dark:border-slate-700/50 dark:bg-slate-800/80">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700/50">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-200">保存到个人库</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
                >
                  关闭
                </button>
              </div>

              <form action={submit} className="space-y-3 p-4">
                <input type="hidden" name="bookmarkId" value={bookmarkId} />
                <TagSelectDropdown
                  options={tags}
                  placeholder="选择个人标签（可选）"
                  emptyText="你还没有个人标签，可先到标签管理里创建"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-600 dark:hover:bg-slate-500"
                  >
                    {isPending ? "保存中..." : "保存"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="保存到个人库"
        title="保存到个人库"
        className={
          triggerClassName ??
          "inline-flex h-7 w-7 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600/70 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        }
      >
        <BookmarkPlus className="h-4 w-4" />
        <span className="sr-only">保存到个人库</span>
      </button>

      {modal}
    </>
  );
}
