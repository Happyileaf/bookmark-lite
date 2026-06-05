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
  ('e80d6f9f-db44-4297-bec7-e4fef8adfdfa', 'APP', NULL, 'learning', '#16A34A', 'General learning and tutorials', 100, 'APP', NOW(), NOW()),
  ('5a02270e-d4b4-4f52-8730-3c02453eb9fd', 'APP', NULL, 'strategy', '#334155', 'Planning strategy frameworks and roadmap methods', 110, 'APP', NOW(), NOW()),
  ('831f0271-c9a8-4c7e-9621-b2fd6a621a80', 'APP', NULL, 'delivery', '#0369A1', 'Execution guidance for implementation and delivery', 120, 'APP', NOW(), NOW()),
  ('e7f86b98-1fa2-43fa-9a61-d0c1b6c8a996', 'APP', NULL, 'release', '#B45309', 'Release readiness and launch governance resources', 130, 'APP', NOW(), NOW()),
  ('9989c897-6d8c-434c-b86d-184a96fc8a3b', 'APP', NULL, 'operations', '#0F766E', 'Production operations and incident handling guides', 140, 'APP', NOW(), NOW()),
  ('0065532a-ee20-409d-8fde-d1fc8953b4d5', 'APP', NULL, 'optimization', '#4338CA', 'Continuous optimization and efficiency improvement references', 150, 'APP', NOW(), NOW()),
  ('35d13551-9426-4a5e-b31b-8e02bb306ba8', 'APP', NULL, 'playbook', '#4B5563', 'Operational playbooks and scenario-based procedures', 160, 'APP', NOW(), NOW()),
  ('79f6dfef-59e4-484c-bf6e-c4e2c48f46c0', 'APP', NULL, 'checklist', '#6B7280', 'Quality and compliance checklists for recurring work', 170, 'APP', NOW(), NOW()),
  ('e004b441-4ae9-4764-aa3d-f15972e287d3', 'APP', NULL, 'template', '#64748B', 'Reusable templates for planning, review, and handoff', 180, 'APP', NOW(), NOW()),
  ('3f61f7d9-5026-4b23-acbc-0588312d38e0', 'APP', NULL, 'metrics', '#7C3AED', 'Metrics references and KPI interpretation assets', 190, 'APP', NOW(), NOW()),
  ('d0515d21-3def-491c-ae82-d3bc44cd793d', 'APP', NULL, 'governance', '#9A3412', 'Governance, policy, and decision accountability resources', 200, 'APP', NOW(), NOW())
ON CONFLICT ("scope_owner_key", "name")
DO UPDATE SET
  "color" = EXCLUDED."color",
  "description" = EXCLUDED."description",
  "sort_order" = EXCLUDED."sort_order",
  "updated_at" = NOW();
