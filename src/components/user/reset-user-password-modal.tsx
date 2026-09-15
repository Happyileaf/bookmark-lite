"use client";

import { Check, Copy, KeyRound } from "lucide-react";
import { useState, useTransition } from "react";
import { resetUserPasswordAction } from "@/actions/user.actions";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

type Props = {
  userId: string;
  userLabel: string;
};

/**
 * 重置用户密码弹窗（管理端）
 *
 * @description 确认后调用服务端生成一次性临时密码；密码仅在结果页展示一次，支持复制，关闭即清除
 * @param props - 目标用户 ID 与展示名
 * @returns 触发按钮与两步弹窗
 */
export function ResetUserPasswordModal({ userId, userLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const close = () => {
    setOpen(false);
    setTemporaryPassword(null);
    setCopied(false);
  };

  const confirm = () => {
    const formData = new FormData();
    formData.set("id", userId);
    startTransition(async () => {
      try {
        const result = await resetUserPasswordAction(formData);
        setTemporaryPassword(result.temporaryPassword);
      } catch {
        toast({ title: "重置密码失败，请重试", variant: "error" });
      }
    });
  };

  const copy = async () => {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
    } catch {
      toast({ title: "复制失败，请手动选择复制", variant: "error" });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="icon-btn"
        title="重置密码"
        aria-label={`重置用户 ${userLabel} 的密码`}
      >
        <KeyRound className="h-3.5 w-3.5" />
      </button>

      <Modal
        open={open}
        onClose={close}
        title="重置密码"
        width={420}
        footer={
          temporaryPassword ? (
            <button
              type="button"
              onClick={close}
              className="h-9 rounded-sm bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:focus-visible:ring-primary/50"
            >
              我已保存，关闭
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={close}
                className="h-9 rounded-sm border border-slate-200 px-4 text-[13px] text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-primary/50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={isPending}
                className="h-9 rounded-sm bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-primary/50"
              >
                {isPending ? "重置中..." : "确认重置"}
              </button>
            </>
          )
        }
      >
        {temporaryPassword ? (
          <div className="space-y-3.5">
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              用户「{userLabel}」的临时密码已生成，请立即传达给用户。关闭后将无法再次查看。
            </p>
            <div className="flex items-center gap-2 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
              <code className="min-w-0 flex-1 truncate font-mono text-[14px] font-semibold tracking-wide text-slate-900 dark:text-slate-100">
                {temporaryPassword}
              </code>
              <button
                type="button"
                onClick={copy}
                className="icon-btn shrink-0"
                title={copied ? "已复制" : "复制"}
                aria-label="复制临时密码"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
            将为用户「{userLabel}」生成一个一次性临时密码，原密码立即失效。用户可使用临时密码登录后再自行修改。
          </p>
        )}
      </Modal>
    </>
  );
}
