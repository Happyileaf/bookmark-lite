# 公共书签库初始化脚本

本目录下的脚本用于初始化 **APP 作用域**的公共书签库（全站可见的公共书签）。

## 脚本清单

| 脚本 | 用途 |
|------|------|
| `initial-bookmarks-and-tags.mjs` | 数据源 — 定义 20 个标签 + 500 个书签 |
| `build-init-dataset.mjs` | 数据构建 — 校验 + 规范化 + 生成 UUID |
| `generate-init-sql.mjs` | 生成 SQL — 输出可手动执行的 SQL 文件 |
| `init-bookmarks-via-prisma.mjs` | Prisma 直连 — 直接通过 Prisma 写入公共书签库 |
| `init-user-bookmarks-via-prisma.mjs` | 用户个人书签初始化 — 给指定用户创建全量数据副本 |
| `init-bookmarks.generated.sql` | 生成产物 — 预生成的 SQL 文件 |

## 使用方式

### 方式一：Prisma 直接写入（推荐）

```bash
# 初始化 APP 公共书签库
pnpm run db:data:seed:app

# 给指定用户初始化个人书签库（会复用 APP 数据源）
node scripts/app-data-init/app-bookmarks-init/init-user-bookmarks-via-prisma.mjs user@example.com
```

### 方式二：生成 SQL 然后手动执行

```bash
node scripts/app-data-init/app-bookmarks-init/generate-init-sql.mjs [输出路径]
```

## 设计特点

- **幂等性**：运行前先清空 APP 作用域旧数据，再重新插入
- **确定性**：ID 由 MD5 种子生成，多次运行数据一致
- **去重**：URL 全局去重，不允许重复

## 数据量

- 标签：20 个
- 书签：500 个
- 覆盖：开发、设计、云服务、工具、效率、学习、娱乐等多个领域
