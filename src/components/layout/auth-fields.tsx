"use client";

import { useState } from "react";

type Props = {
  id: string;
  name: string;
  label: string;
  autoComplete?: string;
  placeholder?: string;
  minLength?: number;
  required?: boolean;
};

function MailIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a10.43 10.43 0 0 0 5.27-1.39" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

export function EmailField({
  id,
  label,
  autoComplete = "email",
  placeholder = "you@example.com",
}: {
  id: string;
  label: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-medium text-[#4b5c58] dark:text-[#a9bcb6]"
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#7a8a86] dark:text-[#7d9089]">
          <MailIcon />
        </span>
        <input
          id={id}
          name="email"
          type="email"
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="bm-input h-[44px] w-full py-2.5 pl-10 pr-3 text-[15px]"
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
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-medium text-[#4b5c58] dark:text-[#a9bcb6]"
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#7a8a86] dark:text-[#7d9089]">
          <LockIcon />
        </span>
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          autoComplete={autoComplete}
          minLength={minLength}
          placeholder={placeholder}
          className="bm-input h-[44px] w-full py-2.5 pl-10 pr-11 text-[15px]"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "隐藏密码" : "显示密码"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex items-center rounded-lg pr-3 text-[#7a8a86] transition-colors hover:text-[#0d9488] dark:text-[#7d9089] dark:hover:text-[#5eead4]"
        >
          {visible ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      </div>
    </div>
  );
}
