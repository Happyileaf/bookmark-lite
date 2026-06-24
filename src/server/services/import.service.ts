import { load } from "cheerio";
import { parse } from "csv-parse/sync";
import { bookmarkService } from "@/server/services/bookmark.service";
import type { SessionUser } from "@/server/auth/session";
import type { DataScope } from "@prisma/client";
import { AppError, isAppError } from "@/server/types/errors";

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

function mapFromCsv(content: string): ImportBookmarkRecord[] {
  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  return rows.map((row) => ({
    title: row.title ?? row.name ?? "",
    url: row.url ?? row.link ?? "",
    description: row.description ?? row.desc ?? "",
    tags: parseTags(row.tags),
  }));
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
  return parsed.map((item) => {
    if (typeof item !== "object" || !item) {
      return { title: "", url: "" };
    }
    const record = item as Record<string, unknown>;
    const tags = Array.isArray(record.tags)
      ? record.tags.map((tag) => String(tag))
      : parseTags(String(record.tags ?? ""));
    return {
      title: String(record.title ?? record.name ?? ""),
      url: String(record.url ?? record.link ?? ""),
      description: record.description ? String(record.description) : "",
      tags,
    };
  });
}

function mapFromHtml(content: string): ImportBookmarkRecord[] {
  const $ = load(content);
  const records: ImportBookmarkRecord[] = [];

  $("a[href]").each((_, el) => {
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

  return records;
}

export const importService = {
  parse(fileName: string, content: string): ImportBookmarkRecord[] {
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
    if (records.length > 20_000) {
      throw new AppError("IMPORT_TOO_LARGE", "单次导入记录数量不能超过 20,000", 413);
    }

    const failures: Array<{ line: number; code: string; message: string }> = [];
    let success = 0;

    for (const [index, item] of records.entries()) {
      try {
        await bookmarkService.create(
          {
            scope,
            title: item.title,
            url: item.url,
            description: item.description,
            tagNames: item.tags ?? [],
          },
          user,
        );
        success += 1;
      } catch (error) {
        if (isAppError(error)) {
          failures.push({
            line: index + 1,
            code: error.code,
            message: error.message,
          });
          continue;
        }
        failures.push({
          line: index + 1,
          code: "INTERNAL_ERROR",
          message: "导入时发生未知错误",
        });
      }
    }

    return {
      total: records.length,
      success,
      failed: failures.length,
      failures,
    };
  },
};
