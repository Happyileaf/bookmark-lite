import { load } from "cheerio";
import { parse as parseCsvStream } from "csv-parse";
import { Readable } from "node:stream";
import { bookmarkService } from "@/server/services/bookmark.service";
import type { SessionUser } from "@/server/auth/session";
import type { DataScope } from "@prisma/client";
import { AppError, isAppError } from "@/server/types/errors";
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
