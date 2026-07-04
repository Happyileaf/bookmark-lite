# 安全漏洞扫描报告

## 概述

本报告针对 Bookmark Lite 代码仓库进行了系统性安全审计，识别了以下中等及以上严重度的安全漏洞：

| 编号 | 漏洞名称 | 严重度 | 影响 |
|------|----------|--------|------|
| BL-001 | URL Metadata API SSRF (服务端请求伪造) | **高** | 内部网络探测、敏感信息泄露 |
| BL-002 | API Token 哈希算法强度不足 | **中** | Token 暴力破解风险 |
| BL-003 | 缺少速率限制机制 | **中** | 暴力破解、资源耗尽攻击 |
| BL-004 | CORS 默认配置过宽 | **中** | 潜在的跨站请求伪造风险 |

---

## 详细漏洞分析

### BL-001: URL Metadata API SSRF (服务端请求伪造)

**严重度**: 高

**攻击者画像**: 外部未认证用户

**可控输入向量**: `/api/url-metadata` POST 请求体中的 `url` 参数

**代码路径**:
1. 用户发送 POST 请求到 `/api/url-metadata`
2. [route.ts](file:///workspace/src/app/api/url-metadata/route.ts#L15) 解析请求体并校验 URL 格式
3. [route.ts](file:///workspace/src/app/api/url-metadata/route.ts#L47) 使用 `fetch(parsed.href)` 向目标 URL 发起请求
4. 返回解析到的页面标题、描述和 favicon

**漏洞详情**:

该 API 缺少以下关键防护：

1. **无认证要求**: 任何未认证用户均可调用此接口
2. **无目标白名单**: 仅校验协议为 HTTP/HTTPS，未限制目标域名或 IP 范围
3. **无请求频率限制**: 可被恶意用户无限次调用

**利用场景**:

攻击者可以构造恶意 URL 探测内部网络服务：

```
POST /api/url-metadata
Content-Type: application/json

{
  "url": "http://192.168.1.1/"
}
```

或尝试读取云元数据服务：

```
POST /api/url-metadata
Content-Type: application/json

{
  "url": "http://169.254.169.254/latest/meta-data/"
}
```

**造成影响**:
- 内部网络拓扑探测
- 云服务元数据泄露（可能包含凭证）
- SSRF 链式攻击
- 拒绝服务（大量并发请求到慢速目标）

**修复方案**:

1. 增加认证要求，仅允许已登录用户调用
2. 实现目标域名/IP 白名单过滤
3. 禁止访问内网 IP 段（10.x.x.x、172.16-31.x.x、192.168.x.x、127.x.x.x）
4. 禁止访问云元数据服务地址（如 169.254.169.254）
5. 添加请求速率限制

**建议代码修改**:

```typescript
const BLOCKED_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
  /^169\.254\./,
];

function isBlockedUrl(url: URL): boolean {
  return BLOCKED_IP_RANGES.some(range => range.test(url.hostname));
}
```

---

### BL-002: API Token 哈希算法强度不足

**严重度**: 中

**攻击者画像**: 已获取数据库访问权限的攻击者或泄露数据库备份的场景

**可控输入向量**: 数据库中的 `token_hash` 字段

**代码路径**:
1. 用户在设置页创建 API Token
2. [api-token.ts](file:///workspace/src/server/auth/api-token.ts#L40) 使用 `createHash("sha256").update(raw).digest("hex")` 计算哈希
3. [api-token.repo.ts](file:///workspace/src/server/repositories/api-token.repo.ts#L32) 将哈希存储到数据库
4. [api-token-guard.ts](file:///workspace/src/server/auth/api-token-guard.ts#L33) 使用相同算法验证 Token

**漏洞详情**:

当前使用 SHA-256 作为 API Token 的哈希算法，存在以下风险：

1. **SHA-256 是快速哈希算法**: 可以在 GPU 上每秒进行数十亿次计算
2. **Token 熵分析**: Token 格式为 `linkflow_` + 64 位十六进制（32 字节随机数据），总熵约 256 位
3. **但哈希值本身可被暴力破解**: 如果数据库泄露，攻击者可以离线暴力破解 Token

虽然代码注释声称"Token 为高熵随机串，使用 SHA-256 即可"，但：
- 高熵仅在 Token 足够长时才有意义
- 64 字符的 hex 字符串可以被高效并行破解
- 缺乏盐值机制

**造成影响**:
- 数据库泄露后，API Token 可被快速破解
- 攻击者获得所有用户的 API 访问权限
- 可绕过认证直接访问用户数据

**修复方案**:

1. 使用 Argon2 或 bcrypt 等慢哈希算法替代 SHA-256
2. 添加随机盐值
3. 增加 Token 长度至至少 48-64 字节随机数据

**建议代码修改**:

```typescript
import argon2 from "argon2";

export async function hashApiToken(raw: string): Promise<string> {
  return argon2.hash(raw, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyApiToken(raw: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, raw);
}
```

---

### BL-003: 缺少速率限制机制

**严重度**: 中

**攻击者画像**: 外部攻击者

**可控输入向量**: 以下端点的请求频率：
- `/api/auth/[...nextauth]` - 登录接口
- `/api/import` - 导入接口
- `/api/export` - 导出接口
- `/api/url-metadata` - URL 元数据接口
- `/api/v1/*` - REST API 接口

**代码路径**:

所有 API 端点均未实现速率限制：

1. [route.ts (auth)](file:///workspace/src/app/api/auth/[...nextauth]/route.ts) - 登录无速率限制
2. [route.ts (import)](file:///workspace/src/app/api/import/route.ts) - 导入无速率限制
3. [route.ts (export)](file:///workspace/src/app/api/export/route.ts) - 导出无速率限制
4. [route.ts (url-metadata)](file:///workspace/src/app/api/url-metadata/route.ts) - 元数据解析无速率限制

**漏洞详情**:

缺少速率限制会导致以下攻击场景：

1. **暴力破解登录**: 攻击者可以无限次尝试用户名密码组合
2. **资源耗尽**: 大量并发请求 `/api/url-metadata` 可以耗尽服务器资源
3. **数据导出滥用**: 恶意用户可以频繁导出数据
4. **导入攻击**: 频繁调用导入接口消耗数据库资源

**造成影响**:
- 用户账户被暴力破解
- 服务拒绝（DoS）
- 数据库资源耗尽
- 云服务费用激增（如果使用外部服务）

**修复方案**:

1. 使用 Next.js 中间件实现速率限制
2. 为登录接口实施严格的速率限制（如 5 次/分钟/IP）
3. 为资源密集型接口（导入、导出、URL 元数据）实施速率限制
4. 考虑使用 Redis 存储速率限制状态

**建议代码修改**:

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RATE_LIMITS = {
  "/api/auth": { max: 5, window: 60 },
  "/api/url-metadata": { max: 10, window: 60 },
  "/api/import": { max: 2, window: 300 },
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  for (const [prefix, limit] of Object.entries(RATE_LIMITS)) {
    if (path.startsWith(prefix)) {
      // 实现速率限制逻辑
      const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";
      const key = `${ip}:${prefix}`;
      
      // 使用 Redis 或内存存储实现
      // 检查是否超过限制
      // 超过则返回 429
    }
  }
  
  return NextResponse.next();
}
```

---

### BL-004: CORS 默认配置过宽

**严重度**: 中

**攻击者画像**: 恶意网站操作者

**可控输入向量**: 浏览器插件 API 端点的 Origin 请求头

**代码路径**:

1. [route.ts (bookmarks)](file:///workspace/src/app/api/extension/bookmarks/route.ts#L9):
   ```typescript
   const ALLOWED_ORIGIN = process.env.EXTENSION_ALLOWED_ORIGIN ?? "*";
   ```

2. [route.ts (verify)](file:///workspace/src/app/api/extension/verify/route.ts#L7):
   ```typescript
   const ALLOWED_ORIGIN = process.env.EXTENSION_ALLOWED_ORIGIN ?? "*";
   ```

**漏洞详情**:

CORS 配置存在以下问题：

1. **默认允许所有来源**: `process.env.EXTENSION_ALLOWED_ORIGIN ?? "*"` 在未设置环境变量时允许任意来源
2. **Bearer Token 认证的 CORS 风险**: 虽然接口使用 Bearer Token 认证，但在某些场景下仍可能存在风险
3. **开发环境与生产环境混淆**: 代码注释提到"生产填固定扩展 ID 来源，开发期放宽"，但默认值为 `"*"`

**造成影响**:
- 开发环境下可能被恶意网站利用
- 如果生产环境忘记配置 `EXTENSION_ALLOWED_ORIGIN`，将允许任意来源访问
- 潜在的跨站请求伪造风险（虽然使用 Token 认证降低了风险）

**修复方案**:

1. 将默认值从 `"*"` 改为更严格的限制（如 `""` 或 `null`）
2. 在生产环境强制要求配置 `EXTENSION_ALLOWED_ORIGIN`
3. 增加环境变量校验，确保生产环境不使用通配符

**建议代码修改**:

```typescript
const ALLOWED_ORIGIN = process.env.EXTENSION_ALLOWED_ORIGIN;

if (process.env.NODE_ENV === "production" && !ALLOWED_ORIGIN) {
  throw new Error("EXTENSION_ALLOWED_ORIGIN must be configured in production");
}

const CORS_ORIGIN = ALLOWED_ORIGIN || (process.env.NODE_ENV === "development" ? "*" : "");
```

---

## 代码库安全亮点

### 良好实践

1. **密码哈希**: 使用 Argon2id 算法，参数配置合理（memoryCost: 19456, timeCost: 2）

2. **输入校验**: 广泛使用 Zod 进行输入校验，包括：
   - [bookmark.schema.ts](file:///workspace/src/server/validators/bookmark.schema.ts) - 书签参数校验
   - [tag.schema.ts](file:///workspace/src/server/validators/tag.schema.ts) - 标签参数校验
   - [import.schema.ts](file:///workspace/src/server/validators/import.schema.ts) - 导入参数校验

3. **参数化查询**: 使用 Prisma ORM，所有数据库查询均为参数化查询，无 SQL 注入风险

4. **权限分离**: 实现了 `assertCanManageScope` 和 `assertCanReadScope` 权限校验函数

5. **审计日志**: 关键操作记录审计日志（[audit.repo.ts](file:///workspace/src/server/repositories/audit.repo.ts)）

6. **Token 软删除**: API Token 使用 `revokedAt` 字段进行软删除，支持立即撤销

7. **环境变量安全**: [secret.ts](file:///workspace/src/server/auth/secret.ts) 对 `NEXTAUTH_SECRET` 进行了强度校验，防止使用弱密钥

8. **导出文件安全**: [export.service.ts](file:///workspace/src/server/services/export.service.ts) 使用 `escapeHtml` 函数对 HTML 内容进行转义，防止 XSS

9. **导入限制**: [import.service.ts](file:///workspace/src/server/services/import.service.ts) 实现了多种导入限制（文件大小、字段长度、记录数量）

---

## 总结

### 风险评估

| 维度 | 评估 | 说明 |
|------|------|------|
| 认证与访问控制 | **良好** | 使用 JWT + Argon2，权限分离完善 |
| 注入防护 | **良好** | Prisma ORM + Zod 校验 |
| 外部交互 | **需改进** | SSRF 风险是主要问题 |
| 敏感数据处理 | **良好** | Token 和密码均使用哈希存储 |
| 安全配置 | **需改进** | CORS 默认配置过宽 |

### 优先修复建议

1. **立即修复** (高风险):
   - BL-001: URL Metadata API SSRF - 添加认证、白名单和速率限制

2. **短期修复** (中风险):
   - BL-002: API Token 哈希算法升级 - 使用 Argon2
   - BL-003: 添加速率限制机制
   - BL-004: 修复 CORS 默认配置

### 安全改进建议

1. 实现完整的速率限制中间件
2. 添加 API 网关层进行统一安全处理
3. 实施更严格的输入校验（如 URL 域名白名单）
4. 添加安全响应头（如 CSP、X-Frame-Options）
5. 考虑使用 Web Application Firewall (WAF)
6. 定期进行安全审计和渗透测试

---

**审计日期**: 2026-07-05

**审计范围**: `/workspace/src/` 目录下所有源代码

**审计方法**: 静态代码分析，追踪完整攻击路径