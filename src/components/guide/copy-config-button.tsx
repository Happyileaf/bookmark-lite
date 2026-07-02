"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type Props = {
  targetId: string;
};

export function CopyConfigButton({ targetId }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const text = target.innerText;

    const done = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        // ignore
      }
      document.body.removeChild(ta);
      done();
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? "已复制" : "复制配置"}
      className="inline-flex h-7 items-center justify-center gap-1.5 rounded-[var(--bm-radius-full)] border px-3 text-[12px] font-medium whitespace-nowrap transition-[background-color,border-color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
      style={{
        borderColor: "var(--bm-color-border)",
        backgroundColor: "var(--bm-color-surface)",
        color: "var(--bm-color-text-secondary)",
        outlineColor: "var(--bm-color-border-focus)",
      }}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      <span>{copied ? "已复制" : "复制"}</span>
    </button>
  );
}
