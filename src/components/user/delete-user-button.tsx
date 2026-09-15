"use client";

import { Trash2, TriangleAlert } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteUserAction } from "@/actions/user.actions";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

type Props = {
  userId: string;
  userLabel: string;
};

/**
 * 删除用户按钮（管理端）
 *
 * @description 弹窗二次确认后删除用户，连带清理其书签、标签与回收站数据，操作不可恢复
 * @param props - 目标用户 ID 与展示名
 * @returns 触发按钮与确认弹窗
 */
export function DeleteUserButton({ userId, userLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const confirm = () => {
    const formData = new FormData();
    formData.set("id", userId);
    startTransition(async () => {
      try {
        await deleteUserAction(formData);
        setOpen(false);
        toast({ title: `已删除用户「${userLabel}」`, variant: "success" });
      } catch {
        toast({ title: "删除失败，请重试", variant: "error" });
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="icon-btn danger"
        title="删除用户"
        aria-label={`删除用户 ${userLabel}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="删除用户"
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
              className="h-9 rounded-sm bg-rose-600 px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "删除中..." : "确认删除"}
            </button>
          </>
        }
      >
        <div className="flex items-start gap-2.5">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
            将删除用户「{userLabel}」及其全部书签、标签与回收站数据，
            <span className="font-medium text-rose-600 dark:text-rose-400">
              此操作不可恢复。
            </span>
          </p>
        </div>
      </Modal>
    </>
  );
}
