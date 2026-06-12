"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type TagOption = {
  id: string;
  name: string;
  color: string | null;
};

type Props = {
  options: TagOption[];
  name?: string;
  defaultValue?: string[];
  placeholder?: string;
  emptyText?: string;
};

function normalizeDefaultValue(defaultValue: string[] | undefined, options: TagOption[]) {
  if (!defaultValue || defaultValue.length === 0) return [];
  const allowed = new Set(options.map((item) => item.name));
  const values = defaultValue.map((item) => item.trim()).filter((item) => allowed.has(item));
  return [...new Set(values)];
}

export function TagSelectDropdown({
  options,
  name = "tags",
  defaultValue,
  placeholder = "选择标签",
  emptyText = "暂无可选标签，请先创建标签",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(() =>
    normalizeDefaultValue(defaultValue, options),
  );
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const toggle = (tagName: string) => {
    setSelected((prev) => {
      const exists = prev.includes(tagName);
      if (exists) {
        return prev.filter((item) => item !== tagName);
      }
      return [...prev, tagName];
    });
  };

  const selectedText =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? selected.join("，")
        : `${selected.slice(0, 2).join("，")} +${selected.length - 2}`;

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selected.join(", ")} />

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700"
      >
        <span className={selected.length === 0 ? "text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-300"}>
          {selectedText}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-500 dark:text-slate-400 ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full rounded border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {options.length > 0 ? (
            <>
              <div className="flex items-center justify-between px-2 py-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span>已选 {selected.length} 个</span>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="rounded px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                >
                  清空
                </button>
              </div>
              <ul role="listbox" aria-multiselectable className="max-h-52 overflow-y-auto py-1">
                {options.map((tag) => {
                  const active = selectedSet.has(tag.name);
                  return (
                    <li key={tag.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => toggle(tag.name)}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
                          active ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100" : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full border border-slate-200 dark:border-slate-600"
                          style={{ backgroundColor: tag.color ?? "#CBD5E1" }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate">{tag.name}</span>
                        <Check
                          className={`h-4 w-4 shrink-0 ${
                            active ? "text-slate-700 opacity-100 dark:text-slate-300" : "text-transparent opacity-0"
                          }`}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="px-2 py-3 text-sm text-slate-500 dark:text-slate-400">{emptyText}</div>
          )}
        </div>
      ) : null}

      {selected.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {selected.map((item) => (
            <span key={item} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}