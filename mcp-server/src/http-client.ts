import { config } from "./config.js";

interface EnvelopeSuccess<T> {
  ok: true;
  data: T;
  requestId?: string;
}

interface EnvelopeError {
  ok: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[] | undefined>;
  };
  requestId?: string;
}

type Envelope<T> = EnvelopeSuccess<T> | EnvelopeError;

/**
 * 携带平台返回错误码与信息的错误类型，供上层透传给 AI 客户端。
 */
export class ApiError extends Error {
  readonly code: string;
  readonly fieldErrors?: Record<string, string[] | undefined>;

  constructor(
    code: string,
    message: string,
    fieldErrors?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function buildUrl(path: string, query?: Record<string, unknown>): string {
  const base = normalizeBaseUrl(config.baseUrl);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(base + normalizedPath);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function request<T>(
  method: string,
  path: string,
  options: { query?: Record<string, unknown>; body?: unknown } = {},
): Promise<T> {
  const url = buildUrl(path, options.query);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.token}`,
    "Content-Type": "application/json",
  };

  const init: RequestInit = { method, headers };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new ApiError(
      "NETWORK_ERROR",
      `无法连接平台（${url}）：${detail}。请检查 LINKFLOW_BASE_URL 是否正确、平台是否可访问。`,
    );
  }

  let payload: Envelope<T> | undefined;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    throw new ApiError(
      "INVALID_RESPONSE",
      `平台返回非 JSON 响应（HTTP ${response.status}）。`,
    );
  }

  if (payload && payload.ok === true) {
    return payload.data;
  }

  if (payload && payload.ok === false) {
    throw new ApiError(
      payload.error.code,
      payload.error.message,
      payload.error.fieldErrors,
    );
  }

  throw new ApiError(
    "INVALID_RESPONSE",
    `平台返回未知格式响应（HTTP ${response.status}）。`,
  );
}

export const httpClient = {
  get<T>(path: string, query?: Record<string, unknown>): Promise<T> {
    return request<T>("GET", path, { query });
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>("POST", path, { body });
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>("PATCH", path, { body });
  },
  del<T>(path: string, body?: unknown, query?: Record<string, unknown>): Promise<T> {
    return request<T>("DELETE", path, { body, query });
  },
};
