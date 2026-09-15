import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

/**
 * 表单级反馈横幅的属性
 */
export type FormAlertProps = {
  /** 反馈类型：error（默认，红色）或 success（绿色） */
  variant?: "error" | "success";
  /** 横幅正文 */
  children: ReactNode;
};

/** 各反馈类型对应的配色类名（浅底深字风格，含暗色变体） */
const VARIANT_CLASSES = {
  error:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
} as const;

/** 各反馈类型对应的图标 */
const VARIANT_ICONS = {
  error: AlertCircle,
  success: CheckCircle2,
} as const;

/**
 * 表单级反馈横幅
 *
 * @description 渲染与具体字段无关的表单级错误/成功信息（如"邮箱或密码错误"），
 * 带 role="alert" 供屏幕阅读器即时播报；字段级错误请使用字段组件的 error 属性就近展示
 * @param props - 组件属性
 * @param props.variant - 反馈类型，默认 error
 * @param props.children - 横幅正文
 * @returns 表单级反馈横幅
 * @example
 * {error ? <FormAlert>{error}</FormAlert> : null}
 */
export default function FormAlert({ variant = "error", children }: FormAlertProps) {
  const Icon = VARIANT_ICONS[variant];
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded border px-3 py-2.5 text-[13px] leading-relaxed ${VARIANT_CLASSES[variant]}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
