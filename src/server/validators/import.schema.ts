import { z } from "zod";
import { dataScopeSchema } from "@/server/validators/bookmark.schema";

export const importOptionsSchema = z.object({
  scope: dataScopeSchema,
  dryRun: z.boolean().optional().default(false),
});

export const importRecordSchema = z.object({
  title: z.string().trim().min(1).max(300),
  url: z.string().trim().min(1),
  description: z.string().trim().max(2000).optional(),
  tags: z.array(z.string().trim().min(1).max(80)).optional(),
});

export type ImportRecord = z.infer<typeof importRecordSchema>;

/**
 * 导入解析预算常量。
 *
 * 这些上限用于在"解析过程中"及时中止恶意/超大输入，避免同步 CPU 计算阻塞事件循环。
 * 注意：体积上限（route 层 10MB）只防内存耗尽，防不了 CPU 耗尽——
 * 一个 10MB 的超长单行 CSV 就能让同步解析器阻塞数十秒。
 * 因此这里对"字段长度/行字段数/总记录数"做结构化限制。
 */
export const IMPORT_PARSE_LIMITS = {
  /** 单个字段最大长度（字符），防止超长单字段拖慢状态机扫描 */
  MAX_FIELD_LENGTH: 4096,
  /** 单行最大字段数，防止一行含海量列 */
  MAX_FIELDS_PER_ROW: 64,
  /** 解析阶段最大记录数（解析过程中超限即中止，先于 importBookmarks 的 20_000 校验） */
  MAX_RECORDS: 20_000,
  /** HTML 解析前最大体积（字符），cheerio 无法流式解析，超大 HTML 直接拒绝 */
  MAX_HTML_LENGTH: 2 * 1024 * 1024,
  /** JSON 解析后最大记录数，超限拒绝以避免后续逐条写入放大 */
  MAX_JSON_RECORDS: 20_000,
  /** 批量写入时每批的记录数，平衡单次 SQL 大小与连接占用时间 */
  IMPORT_BATCH_SIZE: 500,
} as const;

