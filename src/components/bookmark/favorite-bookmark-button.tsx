"use client";

import { Star, Trash2 } from "lucide-react";
import { useEffect, useTransition } from "react";
import {
  deleteBookmarkAction,
  toggleFavoriteAction,
} from "@/actions/bookmark.actions";
import { useToast } from "@/components/ui";
import type { DataScope } from "@prisma/client";

type Props = {
  bookmarkId: string;
  isFavorite: boolean;
  scope: DataScope;
  onToggle?: (bookmarkId: string, nextIsFavorite: boolean) => void;
};

export function FavoriteBookmarkButton({ bookmarkId, isFavorite, scope, onToggle }: Props) {
  const toggleAction = toggleFavoriteAction.bind(null, scope);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextIsFavorite = !isFavorite;
    startTransition(async () => {
      await toggleAction(formData);
      onToggle?.(bookmarkId, nextIsFavorite);
    });
  };

  const label = isFavorite ? "取消收藏" : "收藏";

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={bookmarkId} />
      <input type="hidden" name="isFavorite" value={isFavorite ? "false" : "true"} />
      <button
        type="submit"
        disabled={isPending}
        aria-label={label}
        title={label}
        className={`inline-flex items-center justify-center rounded-sm p-1 transition-colors disabled:opacity-60 ${
          isFavorite
            ? "text-amber-400 hover:text-amber-500"
            : "text-muted-foreground hover:text-amber-400"
        }`}
      >
        <Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
        <span className="sr-only">{label}</span>
      </button>
    </form>
  );
}

type DeleteProps = {
  bookmarkId: string;
  scope: DataScope;
  title?: string;
};

export function DeleteBookmarkButton({ bookmarkId, scope, title }: DeleteProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", bookmarkId);
      await deleteBookmarkAction.bind(null, scope)(formData);
      toast({
        title: `已删除「${title ?? "书签"}」`,
        action: {
          label: "撤销",
          onClick: () => {
            // TODO(ui-upgrade): 撤销删除动作尚未接线，见 spec 待补逻辑清单
          },
        },
      });
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={bookmarkId} />
      <button
        type="submit"
        disabled={isPending}
        aria-label="删除书签"
        title="删除书签"
        className="icon-btn danger"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">删除书签</span>
      </button>
    </form>
  );
}

const MANAGE_SEARCH_INPUT_ID = "manage-search-q";

export function ManageSearchShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isEditable =
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT" ||
        target?.isContentEditable === true;

      if (isEditable) {
        if (event.key === "Escape" && target?.id === MANAGE_SEARCH_INPUT_ID) {
          (target as HTMLInputElement).blur();
        }
        return;
      }

      if (
        event.key === "/" ||
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")
      ) {
        const input = document.getElementById(MANAGE_SEARCH_INPUT_ID);
        if (input) {
          event.preventDefault();
          input.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
}
