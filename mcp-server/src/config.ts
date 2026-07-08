const SITE_BASE_URL_BY_NODE_ENV: Record<string, string> = {
  production: "https://bookmark-lite.contextlab.top",
  development: "http://localhost:3000",
};

const NODE_ENV = process.env.NODE_ENV === "production" ? "production" : "development";

const BUILD_TIME_BASE_URL =
  SITE_BASE_URL_BY_NODE_ENV[NODE_ENV] ?? SITE_BASE_URL_BY_NODE_ENV.development;

interface AppConfig {
  token: string;
  baseUrl: string;
}

function loadConfig(): AppConfig {
  const token = process.env.LINKFLOW_TOKEN?.trim();

  if (!token) {
    process.stderr.write(
      `[bookmark-lite-mcp] 启动失败：缺少必填环境变量 LINKFLOW_TOKEN。\n` +
        `请在 AI 客户端的 MCP 配置中通过 env 注入平台 /api-tokens 页生成的 API Token（形如 linkflow_xxx）。\n`,
    );
    process.exit(1);
  }

  // 优先级：运行时 LINKFLOW_BASE_URL 覆盖 > 构建期 NODE_ENV 注入的默认域名
  const baseUrl = (process.env.LINKFLOW_BASE_URL?.trim() || BUILD_TIME_BASE_URL).replace(/\/+$/, "");

  return { token, baseUrl };
}

export const config: AppConfig = loadConfig();
