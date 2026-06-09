-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'super_admin');

-- CreateEnum
CREATE TYPE "DataScope" AS ENUM ('APP', 'USER');

-- CreateEnum
CREATE TYPE "TrashObjectType" AS ENUM ('BOOKMARK');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('light', 'dark', 'system');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" UUID NOT NULL,
    "scope" "DataScope" NOT NULL,
    "owner_user_id" UUID,
    "title" VARCHAR(300) NOT NULL,
    "url" TEXT NOT NULL,
    "normalized_url" TEXT NOT NULL,
    "description" TEXT,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "scope_owner_key" VARCHAR(64) NOT NULL,
    "last_visited_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "scope" "DataScope" NOT NULL,
    "owner_user_id" UUID,
    "name" VARCHAR(80) NOT NULL,
    "color" VARCHAR(20),
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "bookmark_count" INTEGER NOT NULL DEFAULT 0,
    "scope_owner_key" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmark_tags" (
    "bookmark_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmark_tags_pkey" PRIMARY KEY ("bookmark_id","tag_id")
);

-- CreateTable
CREATE TABLE "trash_items" (
    "id" UUID NOT NULL,
    "scope" "DataScope" NOT NULL,
    "owner_user_id" UUID,
    "object_type" "TrashObjectType" NOT NULL,
    "object_id" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "deleted_by_user_id" UUID,
    "deleted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trash_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "theme" "Theme",
    "trash_retention_days" INTEGER,
    "audit_retention_days" INTEGER,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "user_id" UUID NOT NULL,
    "theme" "Theme",
    "trash_retention_days" INTEGER,
    "audit_retention_days" INTEGER,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "system_default_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "theme" "Theme" NOT NULL DEFAULT 'system',
    "trash_retention_days" INTEGER NOT NULL DEFAULT 30,
    "audit_retention_days" INTEGER NOT NULL DEFAULT 180,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "system_default_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "role" "Role",
    "action" VARCHAR(100) NOT NULL,
    "target_type" VARCHAR(50) NOT NULL,
    "target_id" TEXT NOT NULL,
    "scope" "DataScope",
    "status" VARCHAR(20) NOT NULL,
    "reason" TEXT,
    "ip" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_metrics" (
    "id" BIGSERIAL NOT NULL,
    "event_name" VARCHAR(100) NOT NULL,
    "user_id" UUID,
    "scope" "DataScope",
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_bookmarks_scope_owner_created" ON "bookmarks"("scope", "owner_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_bookmarks_scope_owner_updated" ON "bookmarks"("scope", "owner_user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "idx_bookmarks_scope_owner_visited" ON "bookmarks"("scope", "owner_user_id", "last_visited_at" DESC);

-- CreateIndex
CREATE INDEX "idx_bookmarks_scope_owner_favorite" ON "bookmarks"("scope", "owner_user_id", "is_favorite", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_bookmarks_visible_app" ON "bookmarks"("is_visible", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_bookmarks_scope_owner_normurl" ON "bookmarks"("scope_owner_key", "normalized_url");

-- CreateIndex
CREATE INDEX "idx_tags_scope_owner_sort" ON "tags"("scope", "owner_user_id", "sort_order" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_tags_scope_owner_name" ON "tags"("scope", "owner_user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tags_scope_owner_name" ON "tags"("scope_owner_key", "name");

-- CreateIndex
CREATE INDEX "idx_bookmark_tags_tag" ON "bookmark_tags"("tag_id", "bookmark_id");

-- CreateIndex
CREATE INDEX "idx_bookmark_tags_bookmark" ON "bookmark_tags"("bookmark_id", "tag_id");

-- CreateIndex
CREATE INDEX "idx_trash_scope_owner_deleted" ON "trash_items"("scope", "owner_user_id", "deleted_at" DESC);

-- CreateIndex
CREATE INDEX "idx_trash_expires_at" ON "trash_items"("expires_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created" ON "audit_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_user_created" ON "audit_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_event_metrics_event_time" ON "event_metrics"("event_name", "occurred_at" DESC);

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmark_tags" ADD CONSTRAINT "bookmark_tags_bookmark_id_fkey" FOREIGN KEY ("bookmark_id") REFERENCES "bookmarks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmark_tags" ADD CONSTRAINT "bookmark_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trash_items" ADD CONSTRAINT "trash_items_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trash_items" ADD CONSTRAINT "trash_items_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_metrics" ADD CONSTRAINT "event_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

