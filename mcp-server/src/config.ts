const DEFAULT_BASE_URL = "https://bookmark-lite.contextlab.top";

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

  const baseUrl = (process.env.LINKFLOW_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");

  return { token, baseUrl };
}

export const config: AppConfig = loadConfig();
