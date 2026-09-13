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
      className={`inline-flex items-center justify-center rounded-sm p-1 transition-colors ${
        copied
          ? "text-emerald-500"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      <span className="sr-only">{copied ? "已复制" : "复制URL"}</span>
    </button>
  );
}
