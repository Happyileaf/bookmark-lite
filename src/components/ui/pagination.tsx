import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  queryParams?: Record<string, string | undefined>;
  itemName?: string;
  emptyText?: string;
  className?: string;
};

const MAX_VISIBLE_PAGES = 7;

function buildPageHref(
  basePath: string,
  queryParams: Record<string, string | undefined>,
  targetPage: number,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== "" && key !== "page") {
      params.set(key, value);
    }
  }
  if (targetPage > 1) {
    params.set("page", String(targetPage));
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function getPageItems(
  currentPage: number,
  totalPages: number,
): Array<number | "gap"> {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "gap"> = [];
  let previous: number | "gap" | undefined;

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
    const isFirstOrLast = pageNumber === 1 || pageNumber === totalPages;
    const isNearCurrent = Math.abs(pageNumber - currentPage) <= 1;
    if (!isFirstOrLast && !isNearCurrent) {
      if (previous !== undefined && previous !== "gap") {
        pages.push("gap");
        previous = "gap";
      }
      continue;
    }
    pages.push(pageNumber);
    previous = pageNumber;
  }

  return pages;
}

export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  queryParams,
  itemName = "条",
  emptyText = "暂无书签",
  className,
}: PaginationProps) {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const params = queryParams ?? {};

  if (total === 0) {
    return (
      <div
        className={`flex items-center justify-between gap-3 ${className ?? ""}`}
      >
        <p className="text-xs text-slate-400 dark:text-slate-500">{emptyText}</p>
      </div>
    );
  }

  const start = (currentPage - 1) * safePageSize + 1;
  const end = Math.min(currentPage * safePageSize, total);
  const pageItems = getPageItems(currentPage, totalPages);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  const arrowClass = (isDisabled: boolean) =>
    `inline-flex h-8 w-8 items-center justify-center rounded-[4px] border ${
      isDisabled
        ? "cursor-not-allowed border-slate-200 text-slate-300 opacity-40 dark:border-slate-700 dark:text-slate-600"
        : "border-slate-200 bg-white text-slate-600 transition-colors hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-card dark:text-slate-300 dark:hover:border-primary dark:hover:text-primary"
    }`;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 ${
        className ?? ""
      }`}
    >
      <p className="text-xs text-slate-400 dark:text-slate-500">
        显示第 {start}–{end} {itemName}，共 {total} {itemName}
      </p>
      <nav className="flex items-center gap-1.5" aria-label="分页">
        {isFirstPage ? (
          <span className={arrowClass(true)} aria-disabled="true">
            <ChevronLeft className="h-4 w-4" />
          </span>
        ) : (
          <Link
            href={buildPageHref(basePath, params, currentPage - 1)}
            aria-label="上一页"
            className={arrowClass(false)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        )}

        {pageItems.map((item, index) =>
          item === "gap" ? (
            <span
              key={`gap-${index}`}
              className="inline-flex w-6 items-center justify-center text-xs text-slate-400 dark:text-slate-500"
            >
              …
            </span>
          ) : (
            <Link
              key={item}
              href={buildPageHref(basePath, params, item)}
              aria-current={item === currentPage ? "page" : undefined}
              className={`inline-flex h-8 min-w-8 items-center justify-center rounded-[4px] border px-1.5 text-[12.5px] transition-colors ${
                item === currentPage
                  ? "border-primary bg-primary font-semibold text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-card dark:text-slate-300 dark:hover:border-primary dark:hover:text-primary"
              }`}
            >
              {item}
            </Link>
          ),
        )}

        {isLastPage ? (
          <span className={arrowClass(true)} aria-disabled="true">
            <ChevronRight className="h-4 w-4" />
          </span>
        ) : (
          <Link
            href={buildPageHref(basePath, params, currentPage + 1)}
            aria-label="下一页"
            className={arrowClass(false)}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </nav>
    </div>
  );
}
