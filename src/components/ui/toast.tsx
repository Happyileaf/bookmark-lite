"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

export const TOAST_DURATION = 4200;

export type ToastVariant = "default" | "success" | "error";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  action?: ToastAction;
  duration?: number;
};

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
  action?: ToastAction;
  expiresAt: number;
};

type ToastContextValue = {
  toast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_ICON: Record<
  Exclude<ToastVariant, "default">,
  typeof CheckCircle2
> = {
  success: CheckCircle2,
  error: AlertCircle,
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

type ToastRowProps = {
  item: ToastItem;
  prefersReducedMotion: boolean;
  onDismiss: (id: number) => void;
};

function ToastRow({ item, prefersReducedMotion, onDismiss }: ToastRowProps) {
  const Icon = item.variant === "default" ? null : VARIANT_ICON[item.variant];

  return (
    <div
      role="status"
      aria-live={item.variant === "error" ? "assertive" : "polite"}
      className={`pointer-events-auto flex max-w-full items-center gap-3 rounded-full bg-slate-900 py-2.5 pl-4 pr-2.5 text-[13px] text-white shadow-xl dark:bg-slate-100 dark:text-slate-900 ${
        prefersReducedMotion ? "" : "ui-toast-enter"
      }`}
    >
      {Icon ? (
        <Icon
          className={`h-4 w-4 shrink-0 ${
            item.variant === "success"
              ? "text-emerald-400 dark:text-emerald-600"
              : "text-rose-400 dark:text-rose-600"
          }`}
        />
      ) : null}
      <div className="min-w-0">
        <p className="truncate font-medium">{item.title}</p>
        {item.description ? (
          <p className="truncate text-white/70 dark:text-slate-900/70">
            {item.description}
          </p>
        ) : null}
      </div>
      {item.action ? (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick();
            onDismiss(item.id);
          }}
          className="h-6 shrink-0 rounded-full px-2.5 text-[12px] font-medium text-blue-400 transition-colors hover:bg-white/10 dark:text-blue-600 dark:hover:bg-slate-900/10"
        >
          {item.action.label}
        </button>
      ) : null}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const isMounted = useIsMounted();
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );
  const nextIdRef = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      setToasts((current) => current.filter((item) => item.expiresAt > now));
    }, 300);
    return () => window.clearInterval(timer);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    const id = nextIdRef.current++;
    const duration = options.duration ?? TOAST_DURATION;
    const item: ToastItem = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant ?? "default",
      action: options.action,
      expiresAt: Date.now() + duration,
    };
    setToasts((current) => [...current, item]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {isMounted
        ? createPortal(
            <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
              {toasts.map((item) => (
                <ToastRow
                  key={item.id}
                  item={item}
                  prefersReducedMotion={prefersReducedMotion}
                  onDismiss={dismiss}
                />
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast 必须在 ToastProvider 内使用");
  }
  return context;
}
