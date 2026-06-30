"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, Copy, Check, X } from "lucide-react";
import {
  createApiTokenAction,
  revokeApiTokenAction,
} from "@/actions/api-token.actions";

/** 列表项 Token（脱敏） */
type TokenItem = {
  id: string;
  name: string;
  tokenPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
};

type Props = {
  tokens: TokenItem[];
};

/**
 * API Token 管理区块
 *
 * @description 用于设置页，支持生成、查看脱敏列表、撤销 Token
 */
export function ApiTokenSection({ tokens: initialTokens }: Props) {
  const [tokens, setTokens] = useState(initialTokens);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [issuedRaw, setIssuedRaw] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    setError(null);
    try {
      const issued = await createApiTokenAction(newName);
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
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setCreating(false);
    }
  }, [newName]);

  const handleCopy = useCallback(async () => {
    if (!issuedRaw) return;
    try {
      await navigator.clipboard.writeText(issuedRaw);
      setCopied(true);
    } catch {
      setError("复制失败，请手动选择文本复制");
    }
  }, [issuedRaw]);

  const handleRevoke = useCallback(async (tokenId: string) => {
    setRevokingId(tokenId);
    setError(null);
    try {
      await revokeApiTokenAction(tokenId);
      setTokens((prev) => prev.filter((t) => t.id !== tokenId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "撤销失败");
    } finally {
      setRevokingId(null);
    }
  }, []);

  return (
    <section className="space-y-3">
      <div className="overflow-hidden rounded border border-slate-200 bg-white dark:border-slate-700/50 dark:bg-slate-800/50">
        {/* 生成区 */}
        <div className="flex items-center gap-2 border-b border-slate-100 p-4 dark:border-slate-700/40">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Token 名称，如：我的Chrome"
            maxLength={100}
            className="flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition hover:border-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:hover:border-slate-500 dark:focus:border-slate-400 dark:focus:ring-slate-700"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            <Plus className="h-4 w-4" />
            {creating ? "生成中..." : "生成新 Token"}
          </button>
        </div>

        {/* 明文展示区 */}
        {issuedRaw && (
          <div className="space-y-2 border-b border-slate-100 bg-amber-50 p-4 dark:border-slate-700/40 dark:bg-amber-900/20">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                新 Token 明文（仅此一次，关闭后不可再查看）
              </p>
              <button
                type="button"
                onClick={() => setIssuedRaw(null)}
                className="text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-white px-2 py-1.5 text-xs text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                {issuedRaw}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex shrink-0 items-center gap-1 rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "已复制" : "复制"}
              </button>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="border-b border-slate-100 bg-red-50 p-3 text-xs text-red-700 dark:border-slate-700/40 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {/* 列表 */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
          {tokens.length === 0 ? (
            <p className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
              暂无 Token
            </p>
          ) : (
            tokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-200">
                    {token.name}
                  </p>
                  <p className="truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                    {token.tokenPrefix}…
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    创建于 {new Date(token.createdAt).toLocaleString()}
                    {token.lastUsedAt
                      ? ` · 最近使用 ${new Date(token.lastUsedAt).toLocaleString()}`
                      : " · 未使用"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(token.id)}
                  disabled={revokingId === token.id}
                  className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-1.5 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {revokingId === token.id ? "撤销中..." : "撤销"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
