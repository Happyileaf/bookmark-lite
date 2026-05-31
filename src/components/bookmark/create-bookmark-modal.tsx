"use client";

import { useState, useTransition } from "react";

type Props = {
  action: (formData: FormData) => Promise<void>;
};

export function CreateBookmarkModal({ action }: Props) {
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
        className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
      >
        新增书签
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="关闭弹窗"
            className="absolute inset-0 bg-black/35"
            onClick={() => setOpen(false)}
          />

          <div className="relative z-10 w-full max-w-2xl rounded border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-base font-semibold text-slate-900">新增书签</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
              >
                关闭
              </button>
            </div>

            <form action={submit} className="grid gap-2 p-4 md:grid-cols-2">
              <input
                name="title"
                required
                placeholder="书签标题"
                className="rounded border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="url"
                required
                placeholder="https://example.com"
                className="rounded border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="tags"
                placeholder="标签（逗号分隔）"
                className="rounded border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="description"
                placeholder="描述（可选）"
                className="rounded border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="mt-1 flex items-center justify-end gap-2 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {isPending ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
