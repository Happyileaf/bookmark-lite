"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useState, useTransition } from "react";

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
        className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
      >
        展示排序
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="关闭弹窗"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md rounded border border-slate-200 bg-white shadow-xl dark:border-slate-700/50 dark:bg-slate-800/80">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700/50">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-200">展示排序</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
              >
                关闭
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-4">
              {tags.length === 0 ? (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">暂无标签</p>
              ) : (
                <ul className="space-y-1">
                  {tags.map((tag, index) => {
                    const isFirst = index === 0;
                    const isLast = index === tags.length - 1;
                    return (
                      <li
                        key={tag.id}
                        className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 dark:border-slate-700/40"
                      >
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-200">
                          <span
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: tag.color ?? "#cbd5e1" }}
                          />
                          {tag.name}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <form action={handleMove}>
                            <input type="hidden" name="id" value={tag.id} />
                            <input type="hidden" name="direction" value="up" />
                            <button
                              type="submit"
                              disabled={isFirst || isPending}
                              className={`rounded border px-1.5 py-1 ${
                                isFirst || isPending
                                  ? "pointer-events-none border-slate-200 text-slate-300 dark:border-slate-700/40 dark:text-slate-500"
                                  : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
                              }`}
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
                              className={`rounded border px-1.5 py-1 ${
                                isLast || isPending
                                  ? "pointer-events-none border-slate-200 text-slate-300 dark:border-slate-700/40 dark:text-slate-500"
                                  : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
                              }`}
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
            </div>

            <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-700/50 dark:text-slate-400">
              调整后的顺序将用于书签展示页面的标签筛选区域
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
