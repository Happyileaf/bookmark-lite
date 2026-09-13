"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { TagChip } from "@/components/ui/tag-chip";

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

type SortSelectProps = {
  name: string;
  defaultValue: string;
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
  const colorByName = useMemo(
    () => new Map(options.map((item) => [item.name, item.color])),
    [options],
  );

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
        className={`ctl flex w-full items-center justify-between gap-2 px-2.5 hover:border-slate-300 dark:hover:border-slate-600 ${
          open
            ? "border-primary shadow-[0_0_0_3px_rgba(37,99,235,0.12)] dark:border-primary dark:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
            : ""
        }`}
      >
        <span
          className={`flex-1 truncate text-left text-[12.5px] leading-6 ${
            selected.length === 0
              ? "text-slate-400 dark:text-slate-500"
              : "text-slate-900 dark:text-slate-100"
          }`}
        >
          {selectedText}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="absolute z-50 mt-1 w-full rounded-sm border border-slate-200 bg-white p-1 shadow-[0_12px_28px_rgba(15,23,42,0.14)] dark:border-slate-700 dark:bg-card dark:shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
          {options.length > 0 ? (
            <>
              <div className="flex items-center justify-between px-2 py-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span>已选 {selected.length} 个</span>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="rounded-sm px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  清空
                </button>
              </div>
              <ul role="listbox" aria-multiselectable className="max-h-56 overflow-y-auto py-1">
                {options.map((tag) => {
                  const active = selectedSet.has(tag.name);
                  return (
                    <li key={tag.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => toggle(tag.name)}
                        className={`flex w-full items-center gap-2 rounded-sm px-2.5 py-[7px] text-left text-[12.5px] leading-snug transition-colors ${
                          active
                            ? "bg-blue-50 font-medium text-primary dark:bg-blue-500/15 dark:text-blue-400"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full border border-slate-200 dark:border-slate-600/70"
                          style={{ backgroundColor: tag.color ?? "#CBD5E1" }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate">{tag.name}</span>
                        <Check
                          className={`h-4 w-4 shrink-0 ${
                            active
                              ? "text-primary opacity-100"
                              : "text-transparent opacity-0"
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
            <TagChip key={item} color={colorByName.get(item) ?? undefined}>
              {item}
            </TagChip>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TagSortSelect({ name, defaultValue }: SortSelectProps) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      aria-label="排序"
      onChange={(event) => {
        event.currentTarget.form?.requestSubmit();
      }}
      className="ctl ctl-sel"
    >
      <option value="default">默认排序</option>
      <option value="bookmark_count_desc">按书签数</option>
      {/* TODO(ui-upgrade): 待补「按最近使用」排序数据与 sort 参数 */}
      <option value="used" disabled>
        按最近使用
      </option>
      <option value="name_asc">按名称 A-Z</option>
    </select>
  );
}
