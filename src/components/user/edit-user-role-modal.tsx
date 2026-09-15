"use client";

import { Pencil } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { updateUserRoleAction } from "@/actions/user.actions";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

type Props = {
  userId: string;
  userLabel: string;
  currentRole: "user" | "super_admin";
};

/**
 * 变更用户角色弹窗（管理端）
 *
 * @description 行内触发后在弹窗中选择目标角色并提交；成功或失败均通过 toast 反馈
 * @param props - 目标用户 ID、展示名与当前角色
 * @returns 触发按钮与弹窗
 */
export function EditUserRoleModal({ userId, userLabel, currentRole }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const formId = useId();

  const submit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await updateUserRoleAction(formData);
        setOpen(false);
        toast({ title: `已更新「${userLabel}」的角色`, variant: "success" });
      } catch {
        toast({ title: "角色更新失败，请重试", variant: "error" });
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="icon-btn"
        title="变更角色"
        aria-label={`变更用户 ${userLabel} 的角色`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="变更角色"
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
              type="submit"
              form={formId}
              disabled={isPending}
              className="h-9 rounded-sm bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-primary/50"
            >
              {isPending ? "保存中..." : "保存"}
            </button>
          </>
        }
      >
        {open ? (
          <form
            key={`role-${userId}`}
            id={formId}
            action={submit}
            className="space-y-3.5"
          >
            <input type="hidden" name="id" value={userId} />
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              正在调整用户「{userLabel}」的角色。
            </p>
            <label className="block">
              <span className="form-label">角色</span>
              <select
                name="role"
                defaultValue={currentRole}
                className="ctl ctl-sel w-full px-3 text-slate-600 dark:text-slate-300"
              >
                <option value="user">普通用户</option>
                <option value="super_admin">超级管理员</option>
              </select>
            </label>
          </form>
        ) : null}
      </Modal>
    </>
  );
}
