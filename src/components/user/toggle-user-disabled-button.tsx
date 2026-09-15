"use client";

import { UserCheck, UserX } from "lucide-react";
import { useState, useTransition } from "react";
import { setUserDisabledAction } from "@/actions/user.actions";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

type Props = {
  userId: string;
  userLabel: string;
  disabled: boolean;
};

/**
 * 禁用/启用用户按钮（管理端）
 *
 * @description 弹窗确认后切换用户状态；禁用会立即终止其会话并阻止登录
 * @param props - 目标用户 ID、展示名与当前禁用状态
 * @returns 触发按钮与确认弹窗
 */
export function ToggleUserDisabledButton({ userId, userLabel, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const confirm = () => {
    const formData = new FormData();
    formData.set("id", userId);
    formData.set("disabled", disabled ? "false" : "true");
    startTransition(async () => {
      try {
        await setUserDisabledAction(formData);
        setOpen(false);
        toast({
          title: disabled
            ? `已启用用户「${userLabel}」`
            : `已禁用用户「${userLabel}」`,
          variant: "success",
        });
      } catch {
        toast({
          title: disabled ? "启用失败，请重试" : "禁用失败，请重试",
          variant: "error",
        });
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={disabled ? "icon-btn" : "icon-btn danger"}
        title={disabled ? "启用" : "禁用"}
        aria-label={`${disabled ? "启用" : "禁用"}用户 ${userLabel}`}
      >
        {disabled ? (
          <UserCheck className="h-3.5 w-3.5" />
        ) : (
          <UserX className="h-3.5 w-3.5" />
        )}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={disabled ? "启用用户" : "禁用用户"}
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
              type="button"
              onClick={confirm}
              disabled={isPending}
              className={`h-9 rounded-sm px-4 text-[13px] font-medium transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-primary/50 ${
                disabled
                  ? "bg-primary text-primary-foreground"
                  : "bg-rose-600 text-white"
              }`}
            >
              {isPending
                ? "提交中..."
                : disabled
                  ? "确认启用"
                  : "确认禁用"}
            </button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
          {disabled
            ? `启用后，用户「${userLabel}」可重新登录并正常使用平台。`
            : `禁用后，用户「${userLabel}」的登录会话将立即失效，且无法再次登录；其数据保留，可随时恢复。`}
        </p>
      </Modal>
    </>
  );
}
