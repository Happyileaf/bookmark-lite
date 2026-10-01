'use client';

import { Shuffle } from "lucide-react";

export function ShuffleButton() {
  return (
    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
      <button
        type="button"
        onClick={() => window.location.reload()}
        aria-label="再来一批随机书签"
        className="inline-flex h-10 items-center gap-1.5 rounded-sm border border-slate-200 bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        <Shuffle className="h-4 w-4" />
        再来一批
      </button>
    </div>
  );
}
