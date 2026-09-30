-- CreateTable
CREATE TABLE "bookmark_visits" (
    "id" BIGSERIAL NOT NULL,
    "bookmark_id" UUID NOT NULL,
    "user_id" UUID,
    "visitor_key" VARCHAR(64) NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmark_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_bookmark_visits_bookmark_time" ON "bookmark_visits"("bookmark_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "idx_bookmark_visits_occurred_at" ON "bookmark_visits"("occurred_at");

-- CreateIndex
CREATE INDEX "idx_bookmark_visits_visitor_bookmark_time" ON "bookmark_visits"("visitor_key", "bookmark_id", "occurred_at" DESC);

-- AddForeignKey
ALTER TABLE "bookmark_visits" ADD CONSTRAINT "bookmark_visits_bookmark_id_fkey" FOREIGN KEY ("bookmark_id") REFERENCES "bookmarks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
