-- AlterTable
-- 调整 token_prefix 长度为30，确保足够容纳任何前缀格式，避免长度限制问题
ALTER TABLE "api_tokens" ALTER COLUMN "token_prefix" TYPE VARCHAR(30);
