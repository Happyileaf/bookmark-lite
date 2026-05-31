export class InvalidUrlError extends Error {
  constructor(message = "URL 格式不正确") {
    super(message);
    this.name = "InvalidUrlError";
  }
}

function normalizePathname(pathname: string): string {
  if (pathname === "/") {
    return pathname;
  }
  return pathname.replace(/\/+$/, "") || "/";
}

export function normalizeUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new InvalidUrlError();
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new InvalidUrlError("仅支持 http/https 链接");
  }

  parsed.protocol = parsed.protocol.toLowerCase();
  parsed.hostname = parsed.hostname.toLowerCase();

  if (
    (parsed.protocol === "http:" && parsed.port === "80") ||
    (parsed.protocol === "https:" && parsed.port === "443")
  ) {
    parsed.port = "";
  }

  parsed.pathname = normalizePathname(parsed.pathname);
  parsed.hash = "";

  const ordered = [...parsed.searchParams.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );
  parsed.search = "";
  for (const [key, value] of ordered) {
    parsed.searchParams.append(key, value);
  }

  return parsed.toString();
}
