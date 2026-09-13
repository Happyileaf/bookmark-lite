"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { TAG_COLOR_PALETTE, TagColorPicker } from "@/components/tag/create-tag-modal";

type TagRow = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
};

type EditProps = {
  action: (formData: FormData) => Promise<void>;
  tag: TagRow;
};

export function EditTagModal({ action, tag }: EditProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formId = useId();

  const submit = (formData: FormData) => {
    startTransition(async () => {
      await action(formData);
      setOpen(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="icon-btn"
        title="编辑"
        aria-label={`编辑标签 ${tag.name}`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="编辑标签"
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
            key={`edit-${tag.id}`}
            id={formId}
            action={submit}
            className="space-y-3.5"
          >
            <input type="hidden" name="id" value={tag.id} />
            <label className="block">
              <span className="form-label">标签名称</span>
              <input
                name="name"
                required
                autoFocus
                maxLength={80}
                defaultValue={tag.name}
                className="ctl w-full px-3"
              />
            </label>
            <label className="block">
              <span className="form-label">描述（可选）</span>
              <input
                name="description"
                maxLength={500}
                defaultValue={tag.description ?? ""}
                placeholder="一句话说明这个标签"
                className="ctl w-full px-3"
              />
            </label>
            <EditTagColorField initialColor={tag.color} />
          </form>
        ) : null}
      </Modal>
    </>
  );
}

function EditTagColorField({ initialColor }: { initialColor: string | null }) {
  const [color, setColor] = useState<string>(initialColor ?? TAG_COLOR_PALETTE[0]);

  return (
    <div>
      <span className="form-label">标签颜色</span>
      <input type="hidden" name="color" value={color} />
      <TagColorPicker value={color} onChange={setColor} />
    </div>
  );
}

type DeleteProps = {
  action: (formData: FormData) => Promise<void>;
  tagId: string;
  tagName: string;
};

export function DeleteTagButton({ action, tagId, tagName }: DeleteProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await action(formData);
        toast({
          title: `已删除标签「${tagName}」`,
          variant: "success",
        });
      } catch {
        toast({
          title: "删除失败，请重试",
          variant: "error",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={tagId} />
      <button
        type="submit"
        disabled={isPending}
        title="删除"
        aria-label={`删除标签 ${tagName}`}
        className="icon-btn danger disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
