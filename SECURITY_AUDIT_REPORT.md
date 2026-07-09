# 安全漏洞扫描报告

## 基本信息

| 项目 | 内容 |
|------|------|
| **项目名称** | bookmark-lite |
| **报告日期** | 2026-07-10 |
| **扫描范围** | `/workspace/src/` |
| **严重级别阈值** | 中等及以上 |

---

## 漏洞概览

| 编号 | 漏洞类型 | 严重级别 | 状态 | 影响模块 |
|------|----------|----------|------|----------|
| BLT-001 | SSRF（服务器端请求伪造） | **高** | 已确认 | `/api/url-metadata` |
| BLT-002 | 缺失速率限制 | **中** | 已确认 | 密码重置、认证接口 |
| BLT-003 | 宽松的 CORS 配置 | **中** | 已确认 | `/api/extension/*` |
| BLT-004 | API Token 无过期机制 | **中** | 已确认 | API Token 系统 |
| BLT-005 | IDOR（不安全的对象引用） | **中** | 已确认 | 书签更新/删除接口 |
| BLT-006 | HTML 导出 XSS 风险 | **中** | 已确认 | 导出服务 |

---

## 详细漏洞描述

### BLT-001: SSRF（服务器端请求伪造）

**严重级别**: 高

**攻击者画像**: 未认证用户、已认证用户

**可控输入向量**:
- `/api/url-metadata` POST 请求的 `url` 参数
- `/api/v1/url-metadata` POST 请求的 `url` 参数（需要 API Token）

**代码路径**:

1. `/api/url-metadata/route.ts`（未认证接口）:
   - 第 15-35 行: 解析并验证 URL 参数
   - 第 47-52 行: **直接发起 fetch 请求**，未验证目标地址是否为内网地址

2. `/api/v1/url-metadata/route.ts`（需认证接口）:
   - 第 20-59 行: `fetchUrlMetadata` 函数同样直接发起请求

**利用方式**:

```bash
# 探测内网服务
curl -X POST http://localhost:3000/api/url-metadata \
  -H "Content-Type: application/json" \
  -d '{"url": "http://192.168.1.1/admin"}'

# 扫描端口
curl -X POST http://localhost:3000/api/url-metadata \
  -H "Content-Type: application/json" \
  -d '{"url": "http://127.0.0.1:22/"}'

# 访问云服务商元数据端点
curl -X POST http://localhost:3000/api/url-metadata \
  -H "Content-Type: application/json" \
  -d '{"url": "http://169.254.169.254/latest/meta-data/"}'
```

**影响**:
- 攻击者可探测内网拓扑和服务
- 攻击者可绕过防火墙访问受限资源
- 在云环境中可能获取云服务商元数据（包含密钥、凭证等敏感信息）
- 可能被用于横向移动攻击

**修复方案**:

```typescript
// 建议实现的修复逻辑
const BLOCKED_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
  /^169\.254\./,
  /^::1/,
];

function isInternalUrl(url: URL): boolean {
  const hostname = url.hostname;
  return BLOCKED_IP_RANGES.some(range => range.test(hostname));
}

// 在发起请求前添加检查
if (isInternalUrl(parsed)) {
  throw new AppError("VALIDATION_FAILED", "不允许访问内网地址", 403);
}
```

---

### BLT-002: 缺失速率限制

**严重级别**: 中

**攻击者画像**: 未认证用户

**可控输入向量**:
- `/actions/auth.actions.ts` 中的密码重置请求
- `/api/auth/[...nextauth]/route.ts` 中的登录请求

**代码路径**:

1. `/actions/auth.actions.ts` 第 91-124 行: `requestPasswordResetAction` 函数
   - 未对同一邮箱的重置请求次数进行限制
   - 未检查时间窗口内的请求频率

2. `/server/auth/auth.ts` 第 29-57 行: CredentialsProvider 的 `authorize` 函数
   - 未对登录失败次数进行限制
   - 未实现账户锁定机制

**利用方式**:

```bash
# 暴力破解密码（无限制尝试）
for i in $(seq 1 1000); do
  curl -X POST http://localhost:3000/api/auth/callback/credentials \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "email=user@example.com&password=attempt$i"
done

# 邮件轰炸攻击
for i in $(seq 1 100); do
  curl -X POST http://localhost:3000/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email": "target@example.com"}'
done
```

**影响**:
- 攻击者可对账户密码进行暴力破解
- 可导致邮件服务被滥用，触发邮件服务提供商的限制
- 可能导致用户邮箱被大量邮件淹没

**修复方案**:

```typescript
// 建议实现速率限制中间件或服务
const RATE_LIMITS = {
  login: { max: 5, windowMs: 60000 },
  passwordReset: { max: 3, windowMs: 180000 },
};

// 使用固定窗口或滑动窗口算法实现
async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const windowKey = `${key}:${Math.floor(now / windowMs)}`;
  const count = await getRedisCounter(windowKey);
  
  if (count >= limit) {
    return false;
  }
  
  await incrementRedisCounter(windowKey);
  return true;
}
```

---

### BLT-003: 宽松的 CORS 配置

**严重级别**: 中

**攻击者画像**: 恶意网站开发者

**可控输入向量**:
- `/api/extension/bookmarks/route.ts` 的 CORS 响应头
- `/api/extension/verify/route.ts` 的 CORS 响应头

**代码路径**:

1. `/api/extension/bookmarks/route.ts` 第 9 行:
   ```typescript
   const ALLOWED_ORIGIN = process.env.EXTENSION_ALLOWED_ORIGIN ?? "*";
   ```

2. `/api/extension/verify/route.ts` 第 7 行:
   ```typescript
   const ALLOWED_ORIGIN = process.env.EXTENSION_ALLOWED_ORIGIN ?? "*";
   ```

**利用方式**:

攻击者可在恶意网站中通过 JavaScript 发起跨域请求：

```javascript
// 恶意网站中的代码
fetch('https://target-domain.com/api/extension/verify', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + stolenToken
  },
  credentials: 'include'
})
.then(response => response.json())
.then(data => {
  // 验证 Token 是否有效
});
```

**影响**:
- 虽然这些接口使用 Bearer Token 鉴权，但宽松的 CORS 策略可能被用于 Token 泄露检测
- 可能被用于 CSRF 攻击（如果 Token 存储在 Cookie 中）
- 降低了浏览器的同源策略保护

**修复方案**:

```typescript
// 生产环境必须配置具体的扩展 ID
const ALLOWED_ORIGIN = process.env.EXTENSION_ALLOWED_ORIGIN;

if (!ALLOWED_ORIGIN && process.env.NODE_ENV === 'production') {
  throw new Error('EXTENSION_ALLOWED_ORIGIN 必须在生产环境中配置');
}
```

---

### BLT-004: API Token 无过期机制

**严重级别**: 中

**攻击者画像**: 获取了 Token 的攻击者

**可控输入向量**:
- API Token 泄露后的持续滥用

**代码路径**:

1. `/prisma/schema.prisma` 第 54-67 行: `ApiToken` 模型
   - 只包含 `revokedAt` 字段，没有 `expiresAt` 字段

2. `/server/auth/api-token-guard.ts` 第 33-36 行:
   ```typescript
   const record = await apiTokenRepo.findActiveByHash(tokenHash);
   if (!record || record.revokedAt) {
     throw new AppError("AUTH_REQUIRED", "无效的访问令牌", 401);
   }
   ```
   - 只检查 `revokedAt`，未检查过期时间

**影响**:
- Token 一旦泄露，攻击者可永久使用直到用户主动撤销
- 无法自动轮换密钥，增加长期暴露风险
- 用户可能忘记撤销不再使用的 Token

**修复方案**:

```typescript
// 在 schema.prisma 中添加 expiresAt 字段
model ApiToken {
  // ... 现有字段
  expiresAt DateTime? @map("expires_at") @db.Timestamptz(6)
  
  // ... 索引
}

// 在 api-token-guard.ts 中添加过期检查
if (!record || record.revokedAt || (record.expiresAt && record.expiresAt.getTime() < Date.now())) {
  throw new AppError("AUTH_REQUIRED", "无效的访问令牌", 401);
}
```

---

### BLT-005: IDOR（不安全的对象引用）

**严重级别**: 中

**攻击者画像**: 已认证用户

**可控输入向量**:
- `/api/v1/bookmarks/[id]/route.ts` 的 `PATCH` 请求
- `/api/v1/bookmarks/route.ts` 的 `DELETE` 请求

**代码路径**:

1. `/api/v1/bookmarks/[id]/route.ts` 第 50-62 行:
   ```typescript
   await bookmarkService.update(
     {
       id,
       scope: parsed.data.scope as DataScope,
       // ...
     },
     user,
   );
   ```
   - 虽然 `bookmarkService.update` 内部有 `ensureBookmarkOwner` 检查，但依赖用户提供的 `scope` 参数

2. `/server/services/bookmark.service.ts` 第 38-45 行:
   ```typescript
   function ensureBookmarkOwner(
     bookmark: { scope: DataScope; ownerUserId: string | null },
     scope: DataScope,
     ownerUserId: string | null,
   ) {
     if (bookmark.scope !== scope || bookmark.ownerUserId !== ownerUserId) {
       throw new AppError("SCOPE_MISMATCH", "书签与当前数据域不匹配", 403);
     }
   }
   ```

**利用方式**:

```bash
# 用户 A 尝试修改用户 B 的书签
curl -X PATCH http://localhost:3000/api/v1/bookmarks/userB-bookmark-id \
  -H "Authorization: Bearer userA-token" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "USER",
    "title": "恶意修改的标题"
  }'
```

**影响**:
- 用户可能通过构造请求修改或删除其他用户的书签
- 权限边界可被绕过

**修复方案**:

```typescript
// 在 service 层强制从用户会话获取 scope，而非依赖请求参数
async update(input: unknown, user: SessionUser | null) {
  // ... 解析输入
  
  // 强制使用基于用户角色的 scope
  const actualScope = user?.role === 'super_admin' ? parsed.data.scope : 'USER';
  
  // ... 后续逻辑
}
```

---

### BLT-006: HTML 导出 XSS 风险

**严重级别**: 中

**攻击者画像**: 已认证用户（上传恶意书签）

**可控输入向量**:
- 书签的 `title` 和 `url` 字段

**代码路径**:

1. `/server/services/export.service.ts` 第 86-125 行: `toHtml` 函数
   - 第 150-153 行: `renderBookmarkLink` 函数使用 `escapeHtml` 转义
   - 但第 111 行的 `tagName` 输出使用 `escapeHtml`

2. `/server/services/import.service.ts` 第 164-216 行: `mapFromHtml` 函数
   - 解析 HTML 文件时提取标签名称作为标签
   - 标签名称可能包含恶意脚本

**利用方式**:

1. 攻击者创建一个包含恶意脚本的书签：
```html
<!-- 恶意 HTML 文件 -->
<a href="http://example.com"><script>alert('XSS')</script></a>
```

2. 导入后再导出为 HTML：
```bash
curl -X POST http://localhost:3000/api/import?scope=USER \
  -H "Authorization: Bearer user-token" \
  -F "file=@malicious.html"

curl -X GET "http://localhost:3000/api/export?scope=USER&format=html" \
  -H "Authorization: Bearer user-token"
```

3. 导出的 HTML 文件包含未转义的恶意脚本，其他用户导入后可能触发 XSS

**影响**:
- 用户可能导入包含恶意脚本的书签文件
- 导出的 HTML 文件可能被用于钓鱼攻击
- 浏览器可能执行恶意 JavaScript

**修复方案**:

```typescript
// 增强 escapeHtml 函数
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/javascript:/gi, "javascript&#58;")
    .replace(/on\w+=/gi, "&#111;n$1=");
}

// 在导入时添加额外验证
function sanitizeBookmarkTitle(title: string): string {
  return title.replace(/<script[^>]*>.*?<\/script>/gi, '');
}
```

---

## 安全建议

### 1. 实施出站请求过滤
为 `/api/url-metadata` 接口添加目标地址白名单或黑名单，禁止访问内网地址和云服务商元数据端点。

### 2. 部署速率限制
在认证相关接口（登录、密码重置）前部署速率限制中间件，防止暴力破解和邮件轰炸攻击。

### 3. 严格配置 CORS
生产环境必须明确配置 `EXTENSION_ALLOWED_ORIGIN`，禁止使用通配符。

### 4. 实现 Token 生命周期管理
为 API Token 添加过期时间机制，并实现定期轮换策略。

### 5. 强化权限校验
在服务层强制校验用户权限，不依赖请求参数中的 scope。

### 6. 增强输入过滤和输出转义
在导入和导出过程中实施严格的输入验证和输出转义，防止 XSS 攻击。

### 7. 添加安全响应头
配置安全相关的 HTTP 响应头：
- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security`

---

## 结论

本次审计共发现 **6 个**中等及以上严重级别的安全漏洞，其中 **1 个高风险漏洞**（SSRF）需要立即修复。建议优先处理 SSRF 漏洞和速率限制缺失问题，以防止最严重的安全威胁。
