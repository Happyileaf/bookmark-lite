-- AlterTable
-- 扩展 token_prefix 以容纳新前缀 "linkflow_" (9) + 12 位随机字符 = 21
ALTER TABLE "api_tokens" ALTER COLUMN "token_prefix" TYPE VARCHAR(21);
