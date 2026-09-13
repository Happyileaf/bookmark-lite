-- AlterTable
-- 用户昵称：可空，最长 80 字符；用于个人资料与头像展示
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" VARCHAR(80);

-- AlterTable
-- 书签站点图标列历史上经 db push 上线、缺少迁移记录；此处幂等补齐，避免新环境缺列
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookmarks' AND column_name = 'favicon'
  ) THEN
    ALTER TABLE "bookmarks" ADD COLUMN "favicon" TEXT;
  END IF;
END $$;
