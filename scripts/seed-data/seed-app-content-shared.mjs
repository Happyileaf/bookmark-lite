import { createHash } from "node:crypto";
import { APP_SEED_BOOKMARK_GROUPS, APP_SEED_TAGS } from "./app-initial-content.mjs";

export const APP_SCOPE_KEY = "APP";
export const EXPECTED_TAG_COUNT = 10;
export const EXPECTED_BOOKMARK_COUNT = 150;

function uuidFromSeed(seed) {
  const hex = createHash("md5").update(seed).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function canonicalizeUrl(rawUrl) {
  const url = new URL(rawUrl);
  url.hash = "";
  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }
  return url.toString();
}

export function buildSeedData() {
  if (APP_SEED_TAGS.length !== EXPECTED_TAG_COUNT) {
    throw new Error(`Tag count must be ${EXPECTED_TAG_COUNT}, got ${APP_SEED_TAGS.length}.`);
  }

  const tagKeySet = new Set();
  const tags = APP_SEED_TAGS.map((tag, index) => {
    if (tagKeySet.has(tag.key)) {
      throw new Error(`Duplicate tag key: ${tag.key}`);
    }
    tagKeySet.add(tag.key);

    return {
      id: uuidFromSeed(`app-tag:${tag.key}`),
      key: tag.key,
      name: tag.name,
      color: tag.color,
      description: tag.description ?? "",
      sortOrder: (index + 1) * 10
    };
  });

  const bookmarks = [];
  for (const group of APP_SEED_BOOKMARK_GROUPS) {
    if (!tagKeySet.has(group.tagKey)) {
      throw new Error(`Unknown group tagKey: ${group.tagKey}`);
    }
    for (const item of group.bookmarks) {
      const normalizedUrl = canonicalizeUrl(item.url);
      const combinedTagKeys = Array.from(new Set([group.tagKey, ...(item.tagKeys ?? [])]));
      for (const tagKey of combinedTagKeys) {
        if (!tagKeySet.has(tagKey)) {
          throw new Error(`Bookmark "${item.title}" references unknown tag key: ${tagKey}`);
        }
      }

      bookmarks.push({
        id: uuidFromSeed(`app-bookmark:${normalizedUrl}`),
        title: item.title,
        url: item.url,
        normalizedUrl,
        description: item.description ?? "",
        isFavorite: item.isFavorite ?? false,
        isVisible: item.isVisible ?? true,
        tagKeys: combinedTagKeys
      });
    }
  }

  if (bookmarks.length !== EXPECTED_BOOKMARK_COUNT) {
    throw new Error(`Bookmark count must be ${EXPECTED_BOOKMARK_COUNT}, got ${bookmarks.length}.`);
  }

  const normalizedSet = new Set();
  for (const bookmark of bookmarks) {
    if (!bookmark.url.startsWith("http://") && !bookmark.url.startsWith("https://")) {
      throw new Error(`Bookmark URL must start with http(s): ${bookmark.url}`);
    }
    if (normalizedSet.has(bookmark.normalizedUrl)) {
      throw new Error(`Duplicate normalized URL: ${bookmark.normalizedUrl}`);
    }
    normalizedSet.add(bookmark.normalizedUrl);
  }

  return { tags, bookmarks };
}
