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
  /** 字段级错误信息；传入后输入框标记 aria-invalid 并在下方就近展示 */
  error?: string;
  /** 挂载后自动聚焦（用于流程入口的首个字段） */
  autoFocus?: boolean;
  /** 失焦回调（用于 blur 时校验） */
  onBlur?: () => void;
};

/** 邮箱字段的属性（name 固定为 email，无需传入） */
type EmailFieldProps = Omit<Props, "name">;

const LABEL_CLASS =
  "mb-1 block text-[12.5px] font-medium text-slate-500 dark:text-slate-400";
const ICON_CLASS = "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400";
/** 字段级错误文案的统一样式 */
const ERROR_CLASS = "mt-1 text-[12.5px] text-rose-600 dark:text-rose-400";

export function EmailField({
  id,
  label,
  autoComplete = "email",
  placeholder = "you@example.com",
  value,
  onChange,
  error,
  autoFocus,
  onBlur,
}: EmailFieldProps) {
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
          onBlur={onBlur}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="bm-input h-10 w-full pl-9 pr-3 text-[13px]"
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className={ERROR_CLASS}>
          {error}
        </p>
      ) : null}
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
  error,
  autoFocus,
  onBlur,
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
          onBlur={onBlur}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="bm-input h-10 w-full pl-9 pr-10 text-[13px]"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "隐藏密码" : "显示密码"}
          aria-pressed={visible}
          className="icon-btn absolute inset-y-0 right-1 my-auto text-slate-400 transition-colors hover:text-primary"
        >
          {visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className={ERROR_CLASS}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
