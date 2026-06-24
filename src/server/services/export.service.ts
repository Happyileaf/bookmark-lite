import type { SessionUser } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { assertCanReadScope } from "@/server/guard/authorize";
import { resolveScopeContext } from "@/server/guard/scope";
import type { DataScope, Prisma } from "@prisma/client";

type ExportArgs = {
  scope: DataScope;
  user: SessionUser | null;
  ids?: string[];
  view?: string;
};

type ExportFormat = "json" | "csv" | "html";

type ExportBookmark = Prisma.BookmarkGetPayload<{
  include: {
    bookmarkTags: {
      include: { tag: true };
    };
  };
}>;

export const exportService = {
  async getBookmarks(args: ExportArgs) {
    assertCanReadScope(args.scope, args.user);
    const scopeCtx = resolveScopeContext(args.scope, args.user?.id);

    const tagView = args.view?.startsWith("tag:") ? args.view.replace("tag:", "") : null;
    const where = {
      scope: scopeCtx.scope,
      ownerUserId: scopeCtx.ownerUserId,
      ...(scopeCtx.scope === "APP" ? { isVisible: true } : {}),
      ...(args.ids?.length ? { id: { in: args.ids } } : {}),
      ...(tagView
        ? {
            bookmarkTags: {
              some: {
                tagId: tagView,
              },
            },
          }
        : {}),
    };

    return prisma.bookmark.findMany({
      where,
      include: {
        bookmarkTags: {
          include: {
            tag: true,
          },
          orderBy: [{ createdAt: "asc" }],
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });
  },

  toJson(bookmarks: ExportBookmark[]): string {
    return JSON.stringify(
      bookmarks.map((bookmark) => ({
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description,
        tags: bookmark.bookmarkTags.map((item) => item.tag.name),
      })),
      null,
      2,
    );
  },

  toCsv(bookmarks: ExportBookmark[]): string {
    const header = "title,url,description,tags";
    const rows = bookmarks.map((bookmark) => {
      const tags = bookmark.bookmarkTags.map((item) => item.tag.name).join("|");
      const title = JSON.stringify(bookmark.title ?? "");
      const url = JSON.stringify(bookmark.url ?? "");
      const description = JSON.stringify(bookmark.description ?? "");
      const tagCell = JSON.stringify(tags);
      return [title, url, description, tagCell].join(",");
    });
    return [header, ...rows].join("\n");
  },

  toHtml(bookmarks: ExportBookmark[]): string {
    const untagged: ExportBookmark[] = [];
    const groups = new Map<string, ExportBookmark[]>();

    for (const bookmark of bookmarks) {
      const firstTag = bookmark.bookmarkTags[0]?.tag;
      if (!firstTag) {
        untagged.push(bookmark);
        continue;
      }
      const group = groups.get(firstTag.name);
      if (group) {
        group.push(bookmark);
      } else {
        groups.set(firstTag.name, [bookmark]);
      }
    }

    const parts: string[] = [];

    for (const bookmark of untagged) {
      parts.push(renderBookmarkLink(bookmark));
    }

    for (const [tagName, items] of groups) {
      const links = items.map(renderBookmarkLink).join("\n");
      parts.push(`<DT><H3>${escapeHtml(tagName)}</H3>`);
      parts.push("<DL><p>");
      parts.push(links);
      parts.push("</DL><p>");
    }

    return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
${parts.join("\n")}
</DL><p>`;
  },

  formatContent(format: ExportFormat, bookmarks: ExportBookmark[]) {
    switch (format) {
      case "json":
        return { content: exportService.toJson(bookmarks), mime: "application/json" };
      case "csv":
        return { content: exportService.toCsv(bookmarks), mime: "text/csv" };
      case "html":
        return { content: exportService.toHtml(bookmarks), mime: "text/html" };
      default:
        return { content: exportService.toJson(bookmarks), mime: "application/json" };
    }
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderBookmarkLink(bookmark: ExportBookmark): string {
  const title = escapeHtml(bookmark.title || bookmark.url);
  const url = escapeHtml(bookmark.url);
  return `<DT><A HREF="${url}">${title}</A></DT>`;
}
