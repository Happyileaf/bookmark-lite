"use client";

import { X } from "lucide-react";
import {
  useEffect,
  type ReactNode,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: 420 | 440;
};

function subscribeMount(onStoreChange: () => void): () => void {
  const timer = window.setTimeout(onStoreChange, 0);
  return () => window.clearTimeout(timer);
}

function useIsMounted(): boolean {
  return useSyncExternalStore(
    subscribeMount,
    () => true,
    () => false,
  );
}

function subscribeReducedMotion(callback: () => void): () => void {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 420,
}: ModalProps) {
  const isMounted = useIsMounted();
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!isMounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="关闭弹窗"
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/45 ${
          prefersReducedMotion ? "" : "ui-modal-mask-enter"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ maxWidth: width }}
        className={`relative w-full rounded-sm border border-slate-200 bg-white p-5 text-card-foreground shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-foreground ${
          prefersReducedMotion ? "" : "ui-modal-panel-enter"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="flex h-8 w-8 items-center justify-center rounded-sm text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {footer ? (
          <div className="mt-5 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
