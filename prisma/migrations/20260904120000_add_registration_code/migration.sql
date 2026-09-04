-- CreateTable
CREATE TABLE "registration_codes" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "code_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_registration_codes_email_created" ON "registration_codes"("email", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_registration_codes_expires_at" ON "registration_codes"("expires_at");
