import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type SelectOption = {
  value: string | number;
  label: string;
};

type Props = {
  id: string;
  name: string;
  label: string;
  description: string;
  icon: ReactNode;
  defaultValue: string | number;
  options: SelectOption[];
  onChange?: (value: string) => void;
};

export function SettingsSelectRow({
  id,
  name,
  label,
  description,
  icon,
  defaultValue,
  options,
  onChange,
}: Props) {
  return (
    <div className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
          {icon}
          <label htmlFor={id}>{label}</label>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <div className="relative">
        <select
          id={id}
          name={name}
          defaultValue={defaultValue}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          className="peer w-full appearance-none rounded border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-slate-400 dark:focus:ring-slate-600"
        >
          {options.map((option) => (
            <option key={`${name}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition peer-focus:text-slate-600 dark:text-slate-500 dark:peer-focus:text-slate-300" />
      </div>
    </div>
  );
}