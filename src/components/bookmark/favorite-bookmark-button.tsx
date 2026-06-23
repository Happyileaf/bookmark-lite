"use client";

import { Heart } from "lucide-react";
import { useTransition } from "react";
import { toggleFavoriteAction } from "@/actions/bookmark.actions";
import type { DataScope } from "@prisma/client";

type Props = {
  bookmarkId: string;
  isFavorite: boolean;
  scope: DataScope;
};

/**
 * 书签收藏切换按钮
 *
 * @description 用于在书签卡片右上角切换收藏状态，仅用户级书签支持
 * @param bookmarkId - 书签ID
 * @param isFavorite - 当前是否已收藏
 * @param scope - 数据域
 */
export function FavoriteBookmarkButton({ bookmarkId, isFavorite, scope }: Props) {
  const toggleAction = toggleFavoriteAction.bind(null, scope);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      void toggleAction(formData);
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
        className={`inline-flex h-7 w-7 items-center justify-center rounded border transition ${
          isFavorite
            ? "border-rose-300 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 dark:border-rose-700/60 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40"
            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600/70 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        } ${isPending ? "opacity-60" : ""}`}
      >
        <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
        <span className="sr-only">{label}</span>
      </button>
    </form>
  );
}
