"use client";

import { Dices, Plus } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";

type Props = {
  action: (formData: FormData) => Promise<void>;
};

export const TAG_COLOR_PALETTE = [
  "#2563eb",
  "#8b5cf6",
  "#0ea5e9",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#6366f1",
  "#f43f5e",
  "#94a3b8",
  "#14b8a6",
  "#f97316",
  "#a855f7",
] as const;

export function generateRandomColor() {
  const hex = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
  return `#${hex}`;
}

type TagColorPickerProps = {
  value: string;
  onChange: (next: string) => void;
};

export function TagColorPicker({ value, onChange }: TagColorPickerProps) {
  const isRandom = value.length > 0 && !TAG_COLOR_PALETTE.some((item) => item === value);

  return (
    <div className="flex flex-wrap items-center gap-2 pt-0.5">
      {TAG_COLOR_PALETTE.map((color) => {
        const selected = value === color;
        return (
          <button
            key={color}
            type="button"
            aria-label={`选择颜色 ${color}`}
            title={color}
            onClick={() => onChange(color)}
            className={`h-6 w-6 shrink-0 rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.15)] transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:focus-visible:ring-primary/50 ${
              selected
                ? "ring-2 ring-white ring-offset-0 shadow-[0_0_0_2px_#fff,0_0_0_4px_var(--bookmark-primary)] dark:shadow-[0_0_0_2px_#0f172a,0_0_0_4px_#3b82f6]"
                : ""
            }`}
            style={{ backgroundColor: color }}
          />
        );
      })}
      <button
        type="button"
        title="随机颜色"
        aria-label="随机颜色"
        onClick={() => onChange(generateRandomColor())}
        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-500 transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-slate-600 dark:text-slate-400 dark:focus-visible:ring-primary/50 ${
          isRandom
            ? "border-0 text-white shadow-[0_0_0_2px_#fff,0_0_0_4px_var(--bookmark-primary),inset_0_-2px_4px_rgba(0,0,0,0.15)] dark:shadow-[0_0_0_2px_#0f172a,0_0_0_4px_#3b82f6,inset_0_-2px_4px_rgba(0,0,0,0.15)]"
            : ""
        }`}
        style={isRandom ? { backgroundColor: value } : undefined}
      >
        <Dices className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function CreateTagModal({ action }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formId = useId();

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
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-sm bg-primary px-3.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:focus-visible:ring-primary/50"
      >
        <Plus className="h-3.5 w-3.5" />
        新增标签
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新增标签"
        width={420}
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 rounded-sm border border-slate-200 px-4 text-[13px] text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-primary/50"
            >
              取消
            </button>
            <button
              type="submit"
              form={formId}
              disabled={isPending}
              className="h-9 rounded-sm bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-primary/50"
            >
              {isPending ? "保存中..." : "保存"}
            </button>
          </>
        }
      >
        {open ? (
          <form
            key="create"
            id={formId}
            action={submit}
            className="space-y-3.5"
          >
            <label className="block">
              <span className="form-label">标签名称</span>
              <input
                name="name"
                required
                autoFocus
                maxLength={80}
                placeholder="例如：AI-LLM"
                className="ctl w-full px-3"
              />
            </label>
            <label className="block">
              <span className="form-label">描述（可选）</span>
              <input
                name="description"
                maxLength={500}
                placeholder="一句话说明这个标签"
                className="ctl w-full px-3"
              />
            </label>
            <CreateTagColorField />
          </form>
        ) : null}
      </Modal>
    </>
  );
}

function CreateTagColorField() {
  const [color, setColor] = useState<string>(TAG_COLOR_PALETTE[0]);

  return (
    <div>
      <span className="form-label">标签颜色</span>
      <input type="hidden" name="color" value={color} />
      <TagColorPicker value={color} onChange={setColor} />
    </div>
  );
}
