# 数据库运维脚本

本目录下的脚本用于数据库的导出、导入、初始化、迁移等运维操作。

## 脚本清单

| 脚本 | 命令 | 用途 |
|------|------|------|
| `db-init.mjs` | `pnpm run db:init <backup.sql>` | 新建数据库 + 导入备份（自动建库） |
| `db-export.mjs` | `pnpm run db:export [输出路径]` | 导出当前数据库为 SQL 备份文件 |
| `db-import.mjs` | `pnpm run db:import <backup.sql>` | 导入 SQL 备份文件到当前数据库 |
| `db-roundtrip-test.mjs` | `pnpm run db:roundtrip:test [输出路径]` | 验证导出/导入一致性（非破坏性） |
| `prisma-migrate-deploy.mjs` | `pnpm run db:migrate:deploy` | 生产环境执行 Prisma 迁移 |
| `prisma-migrate-baseline.mjs` | `pnpm run db:migrate:baseline [迁移名]` | 给已有数据库初始化 Prisma 迁移基线 |

## 详细说明

### db-init

**用途**：从零开始新建数据库并导入备份。

```bash
pnpm run db:init backups/my-backup.sql
```

- 从 `DATABASE_URL` 解析出数据库名
- 自动检查数据库是否存在，不存在就 `CREATE DATABASE`
- 导入备份 SQL
- 如果数据库已经存在，直接导入（等同于 `db:import`）
- **要求**：数据库用户要有 `CREATEDB` 权限

### db-export

**用途**：导出当前数据库为 SQL 备份文件。

```bash
pnpm run db:export                    # 自动生成文件名到 backups/
pnpm run db:export -- my-backup.sql   # 指定输出路径
```

导出参数：
- `--clean --if-exists`：导入时先 DROP 再 CREATE（幂等）
- `--no-owner --no-privileges`：不导出所有者和权限（跨环境兼容）

### db-import

**用途**：导入 SQL 备份文件到当前数据库。

```bash
pnpm run db:import -- backup.sql
```

- 要求数据库必须已存在
- `ON_ERROR_STOP=1`，出错立即停止

### db-roundtrip-test

**用途**：验证导出/导入流程数据一致性，确保备份可用。

```bash
pnpm run db:roundtrip:test
```

**新流程（非破坏性）**：
1. 统计原库 APP 数据 → 导出备份 → 创建临时数据库 → 导入临时库 → 对比数量 → 删除临时库
2. **原库全程只读，不动任何数据**，零风险

如果匹配 → PASS，否则报错。

### prisma-migrate-deploy

**用途**：在生产环境执行 Prisma 迁移。

```bash
pnpm run db:migrate:deploy
```

- 自动处理 Neon/Supabase 这类带连接池的数据库
- 如果设置了 `DIRECT_URL`，就用直连地址跑迁移（连接池不支持迁移）

### prisma-migrate-baseline

**用途**：给已有数据库初始化 Prisma 迁移系统基线。

```bash
pnpm run db:migrate:baseline
```

典型场景：数据库从备份恢复，表已经存在，但还没有 `_prisma_migrations` 表。跑基线后，后续增量迁移才能正常进行。

## 环境变量

- `DATABASE_URL`：数据库连接地址（必填）
- `DIRECT_URL`：直连地址（用于迁移，可选）
- `PSQL_PATH`：psql 可执行文件路径（可选，找不到时设置）
- `PG_DUMP_PATH`：pg_dump 可执行文件路径（可选，找不到时设置）
