interface AppConfig {
  token: string;
  baseUrl: string;
}

function loadConfig(): AppConfig {
  const token = process.env.LINKFLOW_TOKEN?.trim();
  const baseUrl = process.env.LINKFLOW_BASE_URL?.trim();

  const missing: string[] = [];
  if (!token) missing.push("LINKFLOW_TOKEN");
  if (!baseUrl) missing.push("LINKFLOW_BASE_URL");

  if (missing.length > 0) {
    process.stderr.write(
      `[bookmark-lite-mcp] 启动失败：缺少必填环境变量 ${missing.join("、")}。\n` +
        `请在 AI 客户端的 MCP 配置中通过 env 注入：\n` +
        `  - LINKFLOW_TOKEN：平台 /api-tokens 页生成的 API Token（形如 linkflow_xxx）\n` +
        `  - LINKFLOW_BASE_URL：平台基址（如 https://your-host.com）\n`,
    );
    process.exit(1);
  }

  return { token: token!, baseUrl: baseUrl! };
}

export const config: AppConfig = loadConfig();
