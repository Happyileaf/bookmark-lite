"use client";

import { Shuffle } from "lucide-react";
import { useRef, useState, useTransition } from "react";

type Props = {
  action: (formData: FormData) => Promise<void>;
};

function generateRandomColor() {
  const hex = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
  return `#${hex}`;
}

export function CreateTagModal({ action }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [colorValue, setColorValue] = useState("");
  const colorRef = useRef<HTMLInputElement>(null);

  const submit = (formData: FormData) => {
    startTransition(async () => {
      await action(formData);
      setOpen(false);
    });
  };

  const handleRandomColor = () => {
    const randomColor = generateRandomColor();
    setColorValue(randomColor);
    if (colorRef.current) {
      colorRef.current.value = randomColor;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500"
      >
        新增标签
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="关闭弹窗"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="relative z-10 w-full max-w-xl rounded border border-slate-200 bg-white shadow-xl dark:border-slate-700/50 dark:bg-slate-800/80">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700/50">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-200">新增标签</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
              >
                关闭
              </button>
            </div>

            <form action={submit} className="grid gap-2 p-4">
              <input
                name="name"
                required
                placeholder="标签名称"
                className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:placeholder:text-slate-400"
              />
              <div className="flex items-center gap-2">
                <span
                  className="h-5 w-5 shrink-0 rounded-full"
                  style={{ backgroundColor: colorValue || "#cbd5e1" }}
                />
                <input
                  ref={colorRef}
                  name="color"
                  placeholder="#94a3b8"
                  onChange={(e) => setColorValue(e.target.value)}
                  className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={handleRandomColor}
                  className="shrink-0 rounded border border-slate-300 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700/40 dark:hover:text-slate-200"
                  title="随机生成颜色"
                >
                  <Shuffle className="h-4 w-4" />
                </button>
              </div>
              <input
                name="description"
                placeholder="标签描述（可选）"
                className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:placeholder:text-slate-400"
              />
              <div className="mt-1 flex items-center justify-end gap-2">
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
        </div>
      ) : null}
    </>
  );
}
