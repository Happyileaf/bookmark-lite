"use client";

import { Check, Palette } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  DEFAULT_TEXTURE_MODE,
  TEXTURE_COOKIE_MAX_AGE,
  TEXTURE_COOKIE_NAME,
  TextureModeEnum,
  TextureModeOptions,
  TextureModeSwatchClassMap,
} from "./constants/texture-mode";

/**
 * 读取当前背景纹理模式
 *
 * @description 从 Cookie 解析纹理偏好，未设置或值非法时回退默认模式
 * @returns {TextureModeEnum} 当前背景纹理模式
 * @example
 * const mode = readTextureMode();
 */
function readTextureMode(): TextureModeEnum {
  if (typeof document === "undefined") {
    return DEFAULT_TEXTURE_MODE;
  }
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${TEXTURE_COOKIE_NAME}=([^;]+)`));
  const value = match ? match[1] : null;
  const isValid = Object.values(TextureModeEnum).some((mode) => mode === value);
  return isValid ? (value as TextureModeEnum) : DEFAULT_TEXTURE_MODE;
}

/**
 * 将纹理模式写入 Cookie 并广播变更
 *
 * @description 持久化纹理偏好，并派发 cookiechange 自定义事件通知所有订阅方同步
 * @param {TextureModeEnum} mode - 目标纹理模式
 * @returns {void}
 * @example
 * persistTextureMode(TextureModeEnum.Grid);
 */
function persistTextureMode(mode: TextureModeEnum): void {
  document.cookie = `${TEXTURE_COOKIE_NAME}=${mode};path=/;max-age=${TEXTURE_COOKIE_MAX_AGE};SameSite=Lax`;
  document.dispatchEvent(new Event("cookiechange"));
}

/**
 * 应用纹理模式到根元素
 *
 * @description 设置 html 的 data-texture 属性，驱动 CSS 纹理变体即时切换
 * @param {TextureModeEnum} mode - 目标纹理模式
 * @returns {void}
 * @example
 * applyTextureMode(TextureModeEnum.Noise);
 */
function applyTextureMode(mode: TextureModeEnum): void {
  document.documentElement.setAttribute("data-texture", mode);
}

/**
 * 订阅 Cookie 变更事件
 *
 * @description 监听 cookiechange 自定义事件，供 useSyncExternalStore 订阅使用
 * @param {() => void} callback - Cookie 变更时触发的回调
 * @returns {() => void} 取消订阅函数
 * @example
 * const unsubscribe = subscribeCookieChange(() => console.log("changed"));
 */
function subscribeCookieChange(callback: () => void): () => void {
  document.addEventListener("cookiechange", callback);
  return () => document.removeEventListener("cookiechange", callback);
}

/**
 * 背景纹理切换器
 * 浮动于视口右下角，展开面板可实时预览五种背景纹理，选择即写入 Cookie 持久保存
 */
export default function TextureSwitch() {
  const mode = useSyncExternalStore(
    subscribeCookieChange,
    readTextureMode,
    () => DEFAULT_TEXTURE_MODE,
  );
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const container = containerRef.current;
      const target = event.target;
      if (!container || !(target instanceof Node) || container.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  /**
   * 选择纹理模式
   *
   * @description 即时应用到根元素并写入 Cookie，面板保持展开便于连续点击对比
   * @param {TextureModeEnum} nextMode - 目标纹理模式
   * @returns {void}
   * @example
   * handleSelect(TextureModeEnum.Dots);
   */
  const handleSelect = (nextMode: TextureModeEnum): void => {
    applyTextureMode(nextMode);
    persistTextureMode(nextMode);
  };

  return (
    <div
      ref={containerRef}
      className="fixed right-[calc(1.25rem+env(safe-area-inset-right))] bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-50 print:hidden"
    >
      {isOpen ? (
        <div
          id={panelId}
          role="menu"
          aria-label="背景纹理"
          className="ui-modal-panel-enter absolute right-0 bottom-11 w-64 overflow-hidden rounded-sm border border-border bg-popover shadow-xl"
        >
          <div className="border-b border-border px-4 py-3">
            <div className="text-[13px] font-semibold text-foreground">背景纹理</div>
            <div className="mt-0.5 text-[11.5px] text-muted-foreground">
              点击实时预览，选择自动保存
            </div>
          </div>
          <div className="flex flex-col gap-[3px] px-2 py-1.5">
            {TextureModeOptions.map(({ label, value }) => {
              const isActive = mode === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => handleSelect(value)}
                  className={`flex items-center gap-3 rounded-sm px-2 py-[7px] text-left text-[13px] transition-colors ${
                    isActive
                      ? "bg-slate-100 font-medium text-foreground dark:bg-slate-800"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span
                    className={`texture-swatch ${TextureModeSwatchClassMap[value]}`}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{label}</span>
                  {isActive ? (
                    <Check className="h-4 w-4 text-brand" aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        title="背景纹理"
        aria-label="切换背景纹理"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-popover text-muted-foreground shadow-lg transition-colors hover:text-foreground"
      >
        <Palette className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
