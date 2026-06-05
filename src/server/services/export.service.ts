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
    const links = bookmarks
      .map((bookmark) => `<DT><A HREF="${bookmark.url}">${bookmark.title}</A></DT>`)
      .join("\n");
    return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
${links}
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
