"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type Props = {
  url: string;
};

export function CopyBookmarkUrlButton({ url }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? "已复制" : "复制URL"}
      title={copied ? "已复制" : "复制URL"}
      className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600/70 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      <span className="sr-only">{copied ? "已复制" : "复制URL"}</span>
    </button>
  );
}
