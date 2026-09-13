"use client";

import { Bot, Check, Copy, Inbox, KeyRound, Terminal } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import {
  createApiTokenAction,
  revokeApiTokenAction,
} from "@/actions/api-token.actions";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

type TokenItem = {
  id: string;
  name: string;
  tokenPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
};

type Props = {
  tokens: TokenItem[];
  apiBaseUrl: string;
};

/**
 * 格式化为 YYYY-MM-DD 日期
 *
 * @description 用于 Token 表格的创建时间列
 * @param iso - ISO 时间字符串
 * @returns 形如 2026-08-20 的日期
 */
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 格式化为相对时间
 *
 * @description 用于「最后使用」列；刚刚 / N 分钟前 / N 小时前 / N 天前 / N 个月前 / N 年前
 * @param iso - ISO 时间字符串
 * @returns 相对时间文案
 */
function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} 个月前`;
  return `${Math.floor(months / 12)} 年前`;
}

/**
 * 脱敏 Token
 *
 * @description 列表仅持有明文前 16 位，展示前缀加省略号；空前缀回退为省略号
 * @param tokenPrefix - Token 明文前缀
 * @returns 脱敏后的展示文本
 */
function maskToken(tokenPrefix: string): string {
  // TODO(ui-upgrade): 设计稿掩码为前缀+圆点+末 4 位明文；服务端仅存前 16 位（bml-+12 字符），末 4 位无数据源，暂以圆点补齐
  return tokenPrefix ? `${tokenPrefix}${"•".repeat(16)}` : "•".repeat(16);
}

/**
 * 复制文本到剪贴板
 *
 * @description 优先使用 Clipboard API，不支持时回退到 textarea + execCommand
 * @param text - 待复制文本
 * @returns 是否复制成功
 */
async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}

/**
 * API Token 管理区块
 *
 * @description 支持生成、查看脱敏列表、撤销 Token；含一次性明文弹窗与 curl 快速开始
 */
export function ApiTokenSection({ tokens: initialTokens, apiBaseUrl }: Props) {
  const { toast } = useToast();
  const [tokens, setTokens] = useState(initialTokens);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameInvalid, setNameInvalid] = useState(false);
  const [issuedRaw, setIssuedRaw] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const flashTimerRef = useRef<number | null>(null);
  const codeTimerRef = useRef<number | null>(null);

  const triggerNameFlash = useCallback(() => {
    nameInputRef.current?.focus();
    setNameInvalid(true);
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = window.setTimeout(() => {
      setNameInvalid(false);
      flashTimerRef.current = null;
    }, 1200);
  }, []);

  const handleCreate = useCallback(async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      triggerNameFlash();
      return;
    }
    setCreating(true);
    try {
      const issued = await createApiTokenAction(trimmedName);
      setIssuedRaw(issued.raw);
      setCopied(false);
      setTokens((prev) => [
        {
          id: issued.id,
          name: issued.name,
          tokenPrefix: issued.tokenPrefix,
          lastUsedAt: null,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setNewName("");
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : "生成失败，请重试",
        variant: "error",
      });
    } finally {
      setCreating(false);
    }
  }, [newName, toast, triggerNameFlash]);

  const handleCopyRaw = useCallback(async () => {
    if (!issuedRaw) return;
    const ok = await copyText(issuedRaw);
    if (ok) {
      setCopied(true);
    } else {
      toast({ title: "复制失败，请手动选择文本复制", variant: "error" });
    }
  }, [issuedRaw, toast]);

  const handleCloseModal = useCallback(() => {
    setIssuedRaw(null);
    setCopied(false);
  }, []);

  const handleRevoke = useCallback(
    async (tokenId: string) => {
      setRevokingId(tokenId);
      try {
        await revokeApiTokenAction(tokenId);
        setTokens((prev) => prev.filter((t) => t.id !== tokenId));
        toast({ title: "Token 已撤销", variant: "success" });
      } catch (e) {
        toast({
          title: e instanceof Error ? e.message : "撤销失败，请重试",
          variant: "error",
        });
      } finally {
        setRevokingId(null);
      }
    },
    [toast],
  );

  const curlCommand = `curl -H "Authorization: Bearer <YOUR_TOKEN>" \\
  ${apiBaseUrl}/api/v1/bookmarks`;

  const mcpConfig = `{
  "mcpServers": {
    "bookmark-lite": {
      "command": "npx",
      "args": ["-y", "bookmark-lite-mcp"],
      "env": {
        "API_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}`;

  const handleCopyCode = useCallback(
    async (key: string, text: string) => {
      const ok = await copyText(text);
      if (ok) {
        setCopiedKey(key);
        if (codeTimerRef.current !== null) {
          window.clearTimeout(codeTimerRef.current);
        }
        codeTimerRef.current = window.setTimeout(() => {
          setCopiedKey(null);
          codeTimerRef.current = null;
        }, 1800);
      } else {
        toast({ title: "复制失败，请手动选择文本复制", variant: "error" });
      }
    },
    [toast],
  );

  return (
    <>
      <div className="mt-4 flex items-center justify-end gap-2.5">
        <input
          ref={nameInputRef}
          type="text"
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            if (nameInvalid) setNameInvalid(false);
          }}
          placeholder="Token 名称，如 MCP 本地开发"
          maxLength={100}
          aria-invalid={nameInvalid}
          className={`ctl ctl-sm w-[220px] px-3 text-slate-600 dark:text-slate-300 ${
            nameInvalid ? "border-rose-400 focus:border-rose-400" : ""
          }`}
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-sm bg-primary px-3.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <KeyRound className="h-3.5 w-3.5 shrink-0" />
          {creating ? "生成中..." : "生成新 Token"}
        </button>
      </div>

      <section className="mt-4 overflow-hidden rounded-sm border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {tokens.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="暂无 Token"
            description="生成一个 Token，即可通过 REST API 或 MCP 服务管理书签。"
          />
        ) : (
          <table className="token-table w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-medium text-slate-400 dark:text-slate-500">
                  名称
                </th>
                <th className="px-4 py-2.5 text-left text-[12px] font-medium text-slate-400 dark:text-slate-500">
                  Token
                </th>
                <th className="w-[130px] px-4 py-2.5 text-left text-[12px] font-medium text-slate-400 dark:text-slate-500">
                  创建时间
                </th>
                <th className="w-[130px] px-4 py-2.5 text-left text-[12px] font-medium text-slate-400 dark:text-slate-500">
                  最后使用
                </th>
                <th className="w-[90px] px-4 py-2.5 text-left text-[12px] font-medium text-slate-400 dark:text-slate-500">
                  状态
                </th>
                <th className="w-[150px] px-4 py-2.5 text-left text-[12px] font-medium text-slate-400 dark:text-slate-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tokens.map((token) => (
                <tr key={token.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <KeyRound className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="text-[13px] font-medium text-slate-900 dark:text-slate-100">
                        {token.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="font-mono text-[12.5px] text-slate-500 dark:text-slate-400">
                      {maskToken(token.tokenPrefix)}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-[12.5px] text-slate-400">
                    {formatDate(token.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-[12.5px] text-slate-400">
                    {token.lastUsedAt
                      ? formatRelativeTime(token.lastUsedAt)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <span className="inline-flex h-5 items-center justify-center rounded-sm bg-green-50 px-2.5 text-[12px] leading-normal text-green-600 dark:bg-green-600/15 dark:text-green-400">
                        有效
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3.5">
                      <button
                        type="button"
                        onClick={() => handleRevoke(token.id)}
                        disabled={revokingId === token.id}
                        className="row-act danger disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {revokingId === token.id ? "撤销中..." : "撤销"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="mt-4 grid items-stretch gap-4 md:grid-cols-2">
        <section className="flex flex-col rounded-sm border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
              快速开始
            </h2>
          </div>
          <p className="mt-1.5 line-clamp-3 min-h-[60px] text-[13px] leading-5 text-slate-500 dark:text-slate-400">
            在请求头中携带 Token，即可通过 REST API 管理你的书签：
          </p>
          <div className="relative mt-4 flex flex-1 flex-col overflow-hidden rounded-sm border border-slate-200 dark:border-slate-800">
            <pre className="flex-1 overflow-x-auto whitespace-pre-wrap break-all bg-slate-900 p-3.5 pr-10 font-mono text-[12px] leading-relaxed text-slate-100 dark:bg-slate-950 dark:text-slate-200">
              {curlCommand}
            </pre>
            <p className="border-t border-slate-200 px-3.5 py-2 text-[12px] text-slate-400 dark:border-slate-800">
              GET 查询 · POST 新增 · DELETE 删除
            </p>
            <button
              type="button"
              onClick={() => handleCopyCode("curl", curlCommand)}
              aria-label="复制 curl 示例"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-sm text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-white"
            >
              {copiedKey === "curl" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </section>

        <section className="flex flex-col rounded-sm border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
              MCP 配置
            </h2>
          </div>
          <p className="mt-1.5 line-clamp-3 min-h-[60px] text-[13px] leading-5 text-slate-500 dark:text-slate-400">
            把下面的配置粘贴到支持 MCP 的 AI 助手或工具中，即可在授权范围内管理你的书签：
          </p>
          <div className="relative mt-4 flex flex-1 flex-col overflow-hidden rounded-sm border border-slate-200 dark:border-slate-800">
            <pre className="flex-1 overflow-x-auto whitespace-pre-wrap break-all bg-slate-900 p-3.5 pr-10 font-mono text-[12px] leading-relaxed text-slate-100 dark:bg-slate-950 dark:text-slate-200">
              {mcpConfig}
            </pre>
            <p className="border-t border-slate-200 px-3.5 py-2 text-[12px] text-slate-400 dark:border-slate-800">
              将 <code className="font-mono">&lt;YOUR_TOKEN&gt;</code> 替换为你的 Token
            </p>
            <button
              type="button"
              onClick={() => handleCopyCode("mcp", mcpConfig)}
              aria-label="复制 MCP 配置"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-sm text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-white"
            >
              {copiedKey === "mcp" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </section>
      </div>

      <p className="mt-4 text-[12.5px] text-slate-400">
        需要完整接口文档？查看{" "}
        <Link
          href="/guide"
          className="text-primary transition-colors hover:underline"
        >
          使用指南 · MCP 配置
        </Link>
      </p>

      <Modal
        open={issuedRaw !== null}
        onClose={handleCloseModal}
        title="Token 生成成功"
        width={440}
        footer={
          <button
            type="button"
            onClick={handleCloseModal}
            className="h-8 rounded-sm bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            我已保存
          </button>
        }
      >
        <p className="text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
          请立即复制并妥善保管，关闭后将无法再次查看完整 Token。
        </p>
        <div className="mt-3.5 flex items-center gap-2 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950">
          <code className="min-w-0 flex-1 break-all font-mono text-[12.5px] text-slate-700 dark:text-slate-200">
            {issuedRaw}
          </code>
          <button
            type="button"
            onClick={handleCopyRaw}
            className="inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-sm border border-slate-200 px-2.5 text-[12px] text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Copy className="h-3.5 w-3.5 shrink-0" />
            )}
            {copied ? "已复制" : "复制"}
          </button>
        </div>
      </Modal>
    </>
  );
}
