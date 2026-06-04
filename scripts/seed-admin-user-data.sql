-- Seed personal(USER scope) data for all super admins.
-- Run with:
--   npx prisma db execute --file scripts/seed-admin-user-data.sql --schema prisma/schema.prisma

WITH admin_users AS (
  SELECT id AS user_id
  FROM "users"
  WHERE "role" = 'super_admin'
),
tag_seed AS (
  SELECT *
  FROM (
    VALUES
      ('workbench', '#2563EB', 'Admin personal workbench and dashboards', 10),
      ('release', '#0891B2', 'Release checklists and rollout notes', 20),
      ('security', '#DC2626', 'Security references and response playbooks', 30),
      ('learning', '#16A34A', 'Reading and learning queue', 40),
      ('private', '#7C3AED', 'Private non-public bookmarks', 50)
  ) AS t(name, color, description, sort_order)
)
INSERT INTO "tags" (
  "id",
  "scope",
  "owner_user_id",
  "name",
  "color",
  "description",
  "sort_order",
  "scope_owner_key",
  "created_at",
  "updated_at"
)
SELECT
  (
    SUBSTRING(md5(au.user_id::text || ':tag:' || ts.name), 1, 8) || '-' ||
    SUBSTRING(md5(au.user_id::text || ':tag:' || ts.name), 9, 4) || '-' ||
    SUBSTRING(md5(au.user_id::text || ':tag:' || ts.name), 13, 4) || '-' ||
    SUBSTRING(md5(au.user_id::text || ':tag:' || ts.name), 17, 4) || '-' ||
    SUBSTRING(md5(au.user_id::text || ':tag:' || ts.name), 21, 12)
  )::uuid,
  'USER',
  au.user_id,
  ts.name,
  ts.color,
  ts.description,
  ts.sort_order,
  au.user_id,
  NOW(),
  NOW()
FROM admin_users au
CROSS JOIN tag_seed ts
ON CONFLICT ("scope_owner_key", "name")
DO UPDATE SET
  "color" = EXCLUDED."color",
  "description" = EXCLUDED."description",
  "sort_order" = EXCLUDED."sort_order",
  "updated_at" = NOW();

WITH admin_users AS (
  SELECT id AS user_id
  FROM "users"
  WHERE "role" = 'super_admin'
),
bookmark_seed AS (
  SELECT *
  FROM (
    VALUES
      (
        'SRE Runbook',
        'https://sre.google/workbook/',
        'https://sre.google/workbook/',
        'Operational incident and reliability runbook.',
        true,
        true,
        true
      ),
      (
        'OWASP Cheat Sheet',
        'https://cheatsheetseries.owasp.org/',
        'https://cheatsheetseries.owasp.org/',
        'Quick security implementation checklist.',
        true,
        false,
        true
      ),
      (
        'PostgreSQL Performance',
        'https://www.postgresql.org/docs/current/performance-tips.html',
        'https://www.postgresql.org/docs/current/performance-tips.html',
        'Database tuning reference.',
        false,
        false,
        true
      ),
      (
        'Internal Release Plan',
        'https://example.com/internal/release-plan',
        'https://example.com/internal/release-plan',
        'Internal checklist for next release window.',
        false,
        true,
        false
      ),
      (
        'Personal Notes',
        'https://example.com/private/notes',
        'https://example.com/private/notes',
        'Personal notes, hidden from display view.',
        false,
        false,
        false
      ),
      (
        'Next.js Docs',
        'https://nextjs.org/docs',
        'https://nextjs.org/docs',
        'Framework documentation for daily lookup.',
        false,
        false,
        true
      ),
      (
        'Prisma Docs',
        'https://www.prisma.io/docs',
        'https://www.prisma.io/docs',
        'ORM and migration reference.',
        false,
        false,
        true
      ),
      (
        'Auth.js Docs',
        'https://authjs.dev/getting-started',
        'https://authjs.dev/getting-started',
        'Authentication guide.',
        false,
        false,
        true
      )
  ) AS b(title, url, normalized_url, description, is_favorite, is_pinned, is_visible)
)
INSERT INTO "bookmarks" (
  "id",
  "scope",
  "owner_user_id",
  "title",
  "url",
  "normalized_url",
  "description",
  "is_favorite",
  "is_pinned",
  "is_visible",
  "scope_owner_key",
  "created_at",
  "updated_at"
)
SELECT
  (
    SUBSTRING(md5(au.user_id::text || ':bookmark:' || bs.normalized_url), 1, 8) || '-' ||
    SUBSTRING(md5(au.user_id::text || ':bookmark:' || bs.normalized_url), 9, 4) || '-' ||
    SUBSTRING(md5(au.user_id::text || ':bookmark:' || bs.normalized_url), 13, 4) || '-' ||
    SUBSTRING(md5(au.user_id::text || ':bookmark:' || bs.normalized_url), 17, 4) || '-' ||
    SUBSTRING(md5(au.user_id::text || ':bookmark:' || bs.normalized_url), 21, 12)
  )::uuid,
  'USER',
  au.user_id,
  bs.title,
  bs.url,
  bs.normalized_url,
  bs.description,
  bs.is_favorite,
  bs.is_pinned,
  bs.is_visible,
  au.user_id,
  NOW(),
  NOW()
FROM admin_users au
CROSS JOIN bookmark_seed bs
ON CONFLICT ("scope_owner_key", "normalized_url")
DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "is_favorite" = EXCLUDED."is_favorite",
  "is_pinned" = EXCLUDED."is_pinned",
  "is_visible" = EXCLUDED."is_visible",
  "updated_at" = NOW();

WITH admin_users AS (
  SELECT id AS user_id
  FROM "users"
  WHERE "role" = 'super_admin'
),
bookmark_tag_seed AS (
  SELECT *
  FROM (
    VALUES
      ('https://sre.google/workbook/', 'workbench'),
      ('https://sre.google/workbook/', 'release'),
      ('https://cheatsheetseries.owasp.org/', 'security'),
      ('https://cheatsheetseries.owasp.org/', 'learning'),
      ('https://www.postgresql.org/docs/current/performance-tips.html', 'workbench'),
      ('https://www.postgresql.org/docs/current/performance-tips.html', 'learning'),
      ('https://example.com/internal/release-plan', 'release'),
      ('https://example.com/internal/release-plan', 'private'),
      ('https://example.com/private/notes', 'private'),
      ('https://nextjs.org/docs', 'learning'),
      ('https://www.prisma.io/docs', 'learning'),
      ('https://authjs.dev/getting-started', 'learning'),
      ('https://authjs.dev/getting-started', 'security')
  ) AS bt(normalized_url, tag_name)
)
INSERT INTO "bookmark_tags" (
  "bookmark_id",
  "tag_id",
  "created_at"
)
SELECT
  b.id,
  t.id,
  NOW()
FROM admin_users au
JOIN bookmark_tag_seed bts ON true
JOIN "bookmarks" b
  ON b."scope" = 'USER'
 AND b."owner_user_id" = au.user_id
 AND b."normalized_url" = bts.normalized_url
JOIN "tags" t
  ON t."scope" = 'USER'
 AND t."owner_user_id" = au.user_id
 AND t."name" = bts.tag_name
ON CONFLICT ("bookmark_id", "tag_id")
DO NOTHING;

WITH admin_users AS (
  SELECT id AS user_id
  FROM "users"
  WHERE "role" = 'super_admin'
),
recount AS (
  SELECT
    t.id AS tag_id,
    COUNT(bt."bookmark_id")::int AS cnt
  FROM "tags" t
  LEFT JOIN "bookmark_tags" bt ON bt."tag_id" = t.id
  WHERE t."scope" = 'USER'
    AND t."owner_user_id" IN (SELECT user_id FROM admin_users)
  GROUP BY t.id
)
UPDATE "tags" t
SET
  "bookmark_count" = recount.cnt,
  "updated_at" = NOW()
FROM recount
WHERE t.id = recount.tag_id;
