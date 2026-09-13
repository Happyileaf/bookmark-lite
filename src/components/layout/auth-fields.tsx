"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

type Props = {
  id: string;
  name: string;
  label: string;
  autoComplete?: string;
  placeholder?: string;
  minLength?: number;
  required?: boolean;
  /** 受控值，传入后字段即为受控组件（action 执行后不会被表单重置清空） */
  value?: string;
  /** 受控变更回调 */
  onChange?: (value: string) => void;
};

const LABEL_CLASS =
  "mb-1 block text-[12.5px] font-medium text-slate-500 dark:text-slate-400";
const ICON_CLASS = "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400";

export function EmailField({
  id,
  label,
  autoComplete = "email",
  placeholder = "you@example.com",
  value,
  onChange,
}: {
  id: string;
  label: string;
  autoComplete?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <div className="relative">
        <span className={ICON_CLASS}>
          <Mail className="h-4 w-4" />
        </span>
        <input
          id={id}
          name="email"
          type="email"
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          className="bm-input h-9 w-full pl-9 pr-3 text-[13px]"
        />
      </div>
    </div>
  );
}

export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  placeholder = "至少 8 位字符",
  minLength = 8,
  required = true,
  value,
  onChange,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <div className="relative">
        <span className={ICON_CLASS}>
          <Lock className="h-4 w-4" />
        </span>
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          autoComplete={autoComplete}
          minLength={minLength}
          placeholder={placeholder}
          value={value}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          className="bm-input h-9 w-full pl-9 pr-10 text-[13px]"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "隐藏密码" : "显示密码"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex items-center rounded-sm pr-3 text-slate-400 transition-colors hover:text-primary"
        >
          {visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
