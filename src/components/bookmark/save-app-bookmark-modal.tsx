"use client";

import { BookmarkPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { TagSelectDropdown } from "@/components/tag/tag-select-dropdown";
import { Modal } from "@/components/ui";

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="保存到个人库"
        title="保存到个人库"
        className={
          triggerClassName ??
          "inline-flex items-center justify-center rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
        }
      >
        <BookmarkPlus className="h-4 w-4" />
        <span className="sr-only">保存到个人库</span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="保存到个人库"
        width={420}
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 items-center rounded-sm border border-slate-200 bg-transparent px-4 text-[13px] text-foreground transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              取消
            </button>
            <button
              type="submit"
              form="save-app-bookmark-form"
              disabled={isPending}
              className="inline-flex h-9 items-center rounded-sm bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "保存中..." : "保存"}
            </button>
          </>
        }
      >
        <form id="save-app-bookmark-form" action={submit} className="space-y-3.5">
          <input type="hidden" name="bookmarkId" value={bookmarkId} />
          <TagSelectDropdown
            options={tags}
            placeholder="选择个人标签（可选）"
            emptyText="你还没有个人标签，可先到标签管理里创建"
          />
        </form>
      </Modal>
    </>
  );
}
