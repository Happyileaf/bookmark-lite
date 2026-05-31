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
VALUES
  ('8e4b8ebf-1acd-4848-b923-a921f2206101', 'APP', NULL, 'productivity', '#2563EB', 'Workflow and efficiency resources', 10, 'APP', NOW(), NOW()),
  ('44f5f4a6-b9af-4123-b665-b8a0123bfb2f', 'APP', NULL, 'dev-tools', '#4F46E5', 'Build test and automation tooling', 20, 'APP', NOW(), NOW()),
  ('b2faf174-9212-4ec3-97f7-e9b7cab7e615', 'APP', NULL, 'frontend', '#0EA5E9', 'Client side frameworks and UI resources', 30, 'APP', NOW(), NOW()),
  ('3406733f-896e-4831-9c31-9ab9f9b7cd4f', 'APP', NULL, 'backend', '#0891B2', 'Server side architecture and APIs', 40, 'APP', NOW(), NOW()),
  ('42c2e2e8-e30f-4897-8040-cbbc5f6b56fd', 'APP', NULL, 'database', '#14B8A6', 'Storage and query related resources', 50, 'APP', NOW(), NOW()),
  ('f6f2a2a6-8c98-4f8b-b386-9da93dc190f1', 'APP', NULL, 'ai', '#8B5CF6', 'Artificial intelligence and LLM resources', 60, 'APP', NOW(), NOW()),
  ('7160dfbc-bdf1-4a37-a8b8-7d13fedf6f03', 'APP', NULL, 'design', '#EC4899', 'Product and interface design references', 70, 'APP', NOW(), NOW()),
  ('1a426cd8-f56b-46f7-ab7a-21426fa58195', 'APP', NULL, 'security', '#DC2626', 'Security standards and best practices', 80, 'APP', NOW(), NOW()),
  ('975730be-2466-4aa1-9cb4-0505f9c104f4', 'APP', NULL, 'cloud', '#0284C7', 'Cloud platform and infrastructure guides', 90, 'APP', NOW(), NOW()),
  ('e80d6f9f-db44-4297-bec7-e4fef8adfdfa', 'APP', NULL, 'learning', '#16A34A', 'General learning and tutorials', 100, 'APP', NOW(), NOW())
ON CONFLICT ("scope_owner_key", "name")
DO UPDATE SET
  "color" = EXCLUDED."color",
  "description" = EXCLUDED."description",
  "sort_order" = EXCLUDED."sort_order",
  "updated_at" = NOW();
