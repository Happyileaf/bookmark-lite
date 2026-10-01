'use client';

import { Shuffle } from "lucide-react";

export function ShuffleButton() {
  return (
    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
      <button
        type="button"
        onClick={() => window.location.reload()}
        aria-label="再来一批随机书签"
        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Shuffle className="h-4 w-4" />
      </button>
    </div>
  );
}
