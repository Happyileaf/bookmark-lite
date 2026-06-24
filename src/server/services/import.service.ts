import { load } from "cheerio";
import { parse as parseCsvStream } from "csv-parse";
import { Readable } from "node:stream";
import { normalizeUrl } from "@/lib/url-normalize";
import type { SessionUser } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { resolveScopeContext } from "@/server/guard/scope";
import { auditRepo } from "@/server/repositories/audit.repo";
import { tagRepo } from "@/server/repositories/tag.repo";
import type { DataScope } from "@prisma/client";
import { AppError } from "@/server/types/errors";
import { bookmarkCreateSchema } from "@/server/validators/bookmark.schema";
import { IMPORT_PARSE_LIMITS } from "@/server/validators/import.schema";

export type ImportBookmarkRecord = {
  title: string;
  url: string;
  description?: string;
  tags?: string[];
};

function parseTags(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function assertFieldLength(value: string, field: string) {
  if (value.length > IMPORT_PARSE_LIMITS.MAX_FIELD_LENGTH) {
    throw new AppError(
      "IMPORT_TOO_LARGE",
      `${field} 字段过长，单字段最大 ${IMPORT_PARSE_LIMITS.MAX_FIELD_LENGTH} 字符`,
      413,
    );
  }
}

function mapCsvRow(row: Record<string, string>): ImportBookmarkRecord {
  const keys = Object.keys(row);
  if (keys.length > IMPORT_PARSE_LIMITS.MAX_FIELDS_PER_ROW) {
    throw new AppError(
      "IMPORT_TOO_LARGE",
      `单行字段数过多，最大 ${IMPORT_PARSE_LIMITS.MAX_FIELDS_PER_ROW} 列`,
      413,
    );
  }
  const title = row.title ?? row.name ?? "";
  const url = row.url ?? row.link ?? "";
  const description = row.description ?? row.desc ?? "";
  assertFieldLength(title, "title");
  assertFieldLength(url, "url");
  assertFieldLength(description, "description");
  return {
    title,
    url,
    description,
    tags: parseTags(row.tags),
  };
}

/**
 * 流式解析 CSV：csv-parse 以 Transform stream 方式工作，解析工作被分摊到多个事件循环 tick，
 * 避免同步 /sync 版本在单次调用中独占主线程。
 *
 * 同时在每条记录产出时立即计数，超限即销毁流并抛错——避免解析完成后才校验导致 CPU 已被耗尽。
 */
async function mapFromCsv(content: string): Promise<ImportBookmarkRecord[]> {
  const records: ImportBookmarkRecord[] = [];
  const parser = parseCsvStream({
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return new Promise<ImportBookmarkRecord[]>((resolve, reject) => {
    const stream = Readable.from([content]);
    stream.pipe(parser);

    let aborted = false;
    const abort = (err: unknown) => {
      if (aborted) return;
      aborted = true;
      parser.destroy();
      reject(err);
    };

    parser.on("data", (row: Record<string, string>) => {
      if (aborted) return;
      if (records.length >= IMPORT_PARSE_LIMITS.MAX_RECORDS) {
        abort(
          new AppError(
            "IMPORT_TOO_LARGE",
            `解析阶段记录数超过 ${IMPORT_PARSE_LIMITS.MAX_RECORDS}，请减少文件内容`,
            413,
          ),
        );
        return;
      }
      try {
        records.push(mapCsvRow(row));
      } catch (err) {
        abort(err);
      }
    });

    parser.on("error", (err) => {
      if (!aborted) {
        abort(
          new AppError(
            "IMPORT_UNSUPPORTED_FORMAT",
            `CSV 解析失败：${err.message}`,
            400,
          ),
        );
      }
    });

    parser.on("end", () => {
      if (!aborted) resolve(records);
    });
  });
}

function mapFromJson(content: string): ImportBookmarkRecord[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AppError("IMPORT_UNSUPPORTED_FORMAT", "JSON 内容解析失败", 400);
  }
  if (!Array.isArray(parsed)) {
    throw new AppError("IMPORT_UNSUPPORTED_FORMAT", "JSON 必须是数组结构", 400);
  }
  if (parsed.length > IMPORT_PARSE_LIMITS.MAX_JSON_RECORDS) {
    throw new AppError(
      "IMPORT_TOO_LARGE",
      `JSON 记录数超过 ${IMPORT_PARSE_LIMITS.MAX_JSON_RECORDS}`,
      413,
    );
  }
  return parsed.map((item) => {
    if (typeof item !== "object" || !item) {
      return { title: "", url: "" };
    }
    const record = item as Record<string, unknown>;
    const tags = Array.isArray(record.tags)
      ? record.tags.map((tag) => String(tag))
      : parseTags(String(record.tags ?? ""));
    const title = String(record.title ?? record.name ?? "");
    const url = String(record.url ?? record.link ?? "");
    assertFieldLength(title, "title");
    assertFieldLength(url, "url");
    return {
      title,
      url,
      description: record.description ? String(record.description) : "",
      tags,
    };
  });
}

function mapFromHtml(content: string): ImportBookmarkRecord[] {
  if (content.length > IMPORT_PARSE_LIMITS.MAX_HTML_LENGTH) {
    throw new AppError(
      "IMPORT_TOO_LARGE",
      `HTML 文件过大，最大 ${IMPORT_PARSE_LIMITS.MAX_HTML_LENGTH} 字符`,
      413,
    );
  }
  const $ = load(content);
  const records: ImportBookmarkRecord[] = [];
  let overLimit = false;

  $("a[href]").each((_, el) => {
    if (records.length >= IMPORT_PARSE_LIMITS.MAX_RECORDS) {
      overLimit = true;
      return false;
    }

    const $el = $(el);
    const url = $el.attr("href") ?? "";
    const title = $el.text().trim() || url;

    const folderNames: string[] = [];
    $el.parents("dl").each((_, dl) => {
      const $dl = $(dl);
      let folderName = $dl.prevAll("h3").first().text().trim();
      if (!folderName) {
        folderName = $dl.prevAll("dt").first().find("h3").first().text().trim();
      }
      if (folderName) folderNames.push(folderName);
    });

    const topLevelFolder =
      folderNames.length > 0 ? folderNames[folderNames.length - 1] : "";

    records.push({
      title,
      url,
      description: "",
      tags: topLevelFolder ? [topLevelFolder] : [],
    });
  });

  if (overLimit) {
    throw new AppError(
      "IMPORT_TOO_LARGE",
      `HTML 链接数超过 ${IMPORT_PARSE_LIMITS.MAX_RECORDS}`,
      413,
    );
  }

  return records;
}

export const importService = {
  async parse(fileName: string, content: string): Promise<ImportBookmarkRecord[]> {
    const lowerName = fileName.toLowerCase();
    if (lowerName.endsWith(".csv")) {
      return mapFromCsv(content);
    }
    if (lowerName.endsWith(".json")) {
      return mapFromJson(content);
    }
    if (lowerName.endsWith(".html") || lowerName.endsWith(".htm")) {
      return mapFromHtml(content);
    }
    throw new AppError(
      "IMPORT_UNSUPPORTED_FORMAT",
      "仅支持 HTML / CSV / JSON 导入",
      400,
    );
  },

  async importBookmarks(
    scope: DataScope,
    user: SessionUser | null,
    records: ImportBookmarkRecord[],
  ) {
    if (records.length > IMPORT_PARSE_LIMITS.MAX_RECORDS) {
      throw new AppError("IMPORT_TOO_LARGE", "单次导入记录数量不能超过 20,000", 413);
    }

    const failures: Array<{ line: number; code: string; message: string }> = [];
    const scopeCtx = resolveScopeContext(scope, user?.id);
    const batchSize = IMPORT_PARSE_LIMITS.IMPORT_BATCH_SIZE;

    type PreparedRecord = {
      line: number;
      title: string;
      url: string;
      normalizedUrl: string;
      description: string | null;
      tagNames: string[];
    };

    // Phase 1: 逐条校验 + URL 归一化（纯内存，无 DB 往返）
    const prepared: PreparedRecord[] = [];
    for (const [index, item] of records.entries()) {
      const line = index + 1;
      try {
        const parsed = bookmarkCreateSchema.safeParse({
          scope,
          title: item.title,
          url: item.url,
          description: item.description,
          tagNames: item.tags ?? [],
        });
        if (!parsed.success) {
          const firstError = parsed.error.errors[0];
          failures.push({
            line,
            code: "VALIDATION_FAILED",
            message: firstError?.message ?? "书签参数校验失败",
          });
          continue;
        }

        const normalizedUrl = normalizeUrl(parsed.data.url);

        prepared.push({
          line,
          title: parsed.data.title,
          url: parsed.data.url,
          normalizedUrl,
          description: parsed.data.description || null,
          tagNames: parsed.data.tagNames,
        });
      } catch (error) {
        failures.push({
          line,
          code: "VALIDATION_FAILED",
          message: error instanceof Error ? error.message : "书签参数校验失败",
        });
      }
    }

    if (prepared.length === 0) {
      return {
        total: records.length,
        success: 0,
        failed: failures.length,
        failures,
      };
    }

    // Phase 2: 批量查询已存在的 URL（分批 IN 查询，避免参数超限）
    const existingUrlSet = new Set<string>();
    for (let i = 0; i < prepared.length; i += batchSize) {
      const batch = prepared.slice(i, i + batchSize);
      const found = await prisma.bookmark.findMany({
        where: {
          scopeOwnerKey: scopeCtx.scopeOwnerKey,
          normalizedUrl: { in: batch.map((r) => r.normalizedUrl) },
        },
        select: { normalizedUrl: true },
      });
      found.forEach((b) => existingUrlSet.add(b.normalizedUrl));
    }

    // 过滤重复（DB 已存在 + 批次内重复），仅保留首次出现
    const seenUrls = new Set<string>();
    const toInsert: PreparedRecord[] = [];
    for (const r of prepared) {
      if (existingUrlSet.has(r.normalizedUrl) || seenUrls.has(r.normalizedUrl)) {
        failures.push({
          line: r.line,
          code: "BOOKMARK_DUPLICATE_URL",
          message: "该 URL 已存在",
        });
        continue;
      }
      seenUrls.add(r.normalizedUrl);
      toInsert.push(r);
    }

    if (toInsert.length === 0) {
      return {
        total: records.length,
        success: 0,
        failed: failures.length,
        failures,
      };
    }

    // Phase 3: 批量解析标签（1 次查询 + 1 次 createMany 替代 N 次 findOrCreate）
    const allTagNames = new Set<string>();
    for (const r of toInsert) {
      for (const tag of r.tagNames) allTagNames.add(tag);
    }

    const tagNameToId = new Map<string, string>();
    if (allTagNames.size > 0) {
      const existingTags = await prisma.tag.findMany({
        where: {
          scopeOwnerKey: scopeCtx.scopeOwnerKey,
          name: { in: [...allTagNames] },
        },
        select: { id: true, name: true },
      });
      existingTags.forEach((t) => tagNameToId.set(t.name, t.id));

      const newTagNames = [...allTagNames].filter(
        (name) => !tagNameToId.has(name),
      );
      if (newTagNames.length > 0) {
        // 基于当前 scope 已有最大 sortOrder 递增，避免不同批次 sortOrder 重复
        const maxSortRow = await prisma.tag.aggregate({
          _max: { sortOrder: true },
          where: { scopeOwnerKey: scopeCtx.scopeOwnerKey },
        });
        const baseSortOrder = (maxSortRow._max.sortOrder ?? -1) + 1;

        const newTagsData = newTagNames.map((name, i) => ({
          id: crypto.randomUUID(),
          scope,
          ownerUserId: scopeCtx.ownerUserId,
          scopeOwnerKey: scopeCtx.scopeOwnerKey,
          name,
          sortOrder: baseSortOrder + i,
        }));
        // skipDuplicates 防并发竞态：另一请求可能已创建同名标签
        await prisma.tag.createMany({ data: newTagsData, skipDuplicates: true });

        // 回查补全：并发场景下部分标签可能被 skipDuplicates 跳过，需用 DB 实际 ID
        const resolvedTags = await prisma.tag.findMany({
          where: {
            scopeOwnerKey: scopeCtx.scopeOwnerKey,
            name: { in: newTagNames },
          },
          select: { id: true, name: true },
        });
        resolvedTags.forEach((t) => tagNameToId.set(t.name, t.id));
      }
    }

    // Phase 4: 批量插入书签（createMany 分批，客户端生成 UUID 以便后续关联）
    const bookmarkData = toInsert.map((r) => ({
      id: crypto.randomUUID(),
      scope,
      ownerUserId: scopeCtx.ownerUserId,
      scopeOwnerKey: scopeCtx.scopeOwnerKey,
      title: r.title,
      url: r.url,
      normalizedUrl: r.normalizedUrl,
      description: r.description,
    }));

    const bookmarkIdByUrl = new Map<string, string>();
    bookmarkData.forEach((b) => bookmarkIdByUrl.set(b.normalizedUrl, b.id));

    for (let i = 0; i < bookmarkData.length; i += batchSize) {
      await prisma.bookmark.createMany({
        data: bookmarkData.slice(i, i + batchSize),
        skipDuplicates: true,
      });
    }

    // Phase 5: 批量插入书签-标签关联（createMany 分批）
    const associationData: Array<{ bookmarkId: string; tagId: string }> = [];
    for (const r of toInsert) {
      const bookmarkId = bookmarkIdByUrl.get(r.normalizedUrl);
      if (!bookmarkId) continue;
      for (const tagName of r.tagNames) {
        const tagId = tagNameToId.get(tagName);
        if (tagId) {
          associationData.push({ bookmarkId, tagId });
        }
      }
    }

    for (let i = 0; i < associationData.length; i += batchSize) {
      await prisma.bookmarkTag.createMany({
        data: associationData.slice(i, i + batchSize),
        skipDuplicates: true,
      });
    }

    // Phase 6: 批量刷新标签计数
    const touchedTagIds = new Set(associationData.map((a) => a.tagId));
    if (touchedTagIds.size > 0) {
      await tagRepo.refreshBookmarkCount([...touchedTagIds]);
    }

    // Phase 7: 单条审计日志（替代 N 条 BOOKMARK_CREATE）
    await auditRepo.create({
      userId: user?.id ?? null,
      role: user?.role ?? null,
      action: "BOOKMARK_IMPORT",
      targetType: "BOOKMARK",
      targetId: scopeCtx.scopeOwnerKey,
      scope,
      status: "SUCCESS",
    });

    return {
      total: records.length,
      success: toInsert.length,
      failed: failures.length,
      failures,
    };
  },
};
