"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";

type TagItem = {
  id: string;
  name: string;
  color: string | null;
};

type Props = {
  action: (formData: FormData) => Promise<void>;
  tags: TagItem[];
};

export function ReorderTagModal({ action, tags }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleMove = (formData: FormData) => {
    startTransition(async () => {
      await action(formData);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="手动调整标签展示顺序"
        aria-label="自定义标签排序"
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-sm border border-slate-200 px-3 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-primary/50"
      >
        <ArrowUpDown className="h-3.5 w-3.5" />
        自定义排序
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="标签排序"
        width={440}
        footer={
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-9 rounded-sm bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:focus-visible:ring-primary/50"
          >
            完成
          </button>
        }
      >
        {tags.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-slate-400 dark:text-slate-500">
            暂无标签
          </p>
        ) : (
          <ul className="-mx-1 max-h-[320px] space-y-1 overflow-y-auto pr-1">
            {tags.map((tag, index) => {
              const isFirst = index === 0;
              const isLast = index === tags.length - 1;
              return (
                <li
                  key={tag.id}
                  className="flex items-center justify-between gap-3 rounded-sm border border-slate-200 px-3 py-2 transition-colors hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                >
                  <span className="inline-flex min-w-0 items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: tag.color ?? "#94a3b8" }}
                    />
                    <span className="truncate text-[13px] font-medium text-slate-800 dark:text-slate-200">
                      {tag.name}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-0.5">
                    <form action={handleMove}>
                      <input type="hidden" name="id" value={tag.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        type="submit"
                        disabled={isFirst || isPending}
                        title="上移"
                        aria-label={`上移标签 ${tag.name}`}
                        className="icon-btn disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                    </form>
                    <form action={handleMove}>
                      <input type="hidden" name="id" value={tag.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        type="submit"
                        disabled={isLast || isPending}
                        title="下移"
                        aria-label={`下移标签 ${tag.name}`}
                        className="icon-btn disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-400 dark:border-slate-700 dark:text-slate-500">
          调整后的顺序将用于书签展示页面的标签筛选区域
        </p>
      </Modal>
    </>
  );
}
