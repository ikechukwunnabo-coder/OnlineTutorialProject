import { ApiError, parseApiError } from "./errors";
import type {
  Category,
  CategoryDetail,
  ChapterDetail,
  Difficulty,
  HomeData,
  Paginated,
  SearchResults,
  SearchSuggestions,
  TutorialDetail,
  TutorialListItem,
} from "./types";

const API_BASE = (process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8000/api/v1").replace(
  /\/$/,
  "",
);
const REQUEST_TIMEOUT_MS = 8_000;

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions {
  query?: Record<string, QueryValue>;
  revalidate?: number;
  tags?: string[];
  noStore?: boolean;
}

interface TutorialFilters {
  category?: string;
  difficulty?: Difficulty | "";
  tag?: string;
  ordering?: "-published_at" | "published_at" | "title" | "estimated_reading_time";
  page?: number;
  pageSize?: number;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  };

  if (options.noStore) {
    init.cache = "no-store";
  } else {
    init.next = {
      revalidate: options.revalidate,
      tags: options.tags,
    };
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), init);
  } catch {
    throw new ApiError("The catalog is temporarily unavailable. Please try again shortly.", {
      status: 503,
      code: "network_error",
    });
  }

  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    throw parseApiError(response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getHome(): Promise<HomeData> {
  return request<HomeData>("/home/", {
    revalidate: 60,
    tags: ["home", "catalog"],
  });
}

export function getCategories(): Promise<Category[]> {
  return request<Category[]>("/categories/", {
    revalidate: 300,
    tags: ["catalog"],
  });
}

export function getCategory(slug: string): Promise<CategoryDetail> {
  return request<CategoryDetail>(`/categories/${encodeURIComponent(slug)}/`, {
    revalidate: 300,
    tags: [`category:${slug}`, "catalog"],
  });
}

export function getTutorials(filters: TutorialFilters = {}): Promise<Paginated<TutorialListItem>> {
  return request<Paginated<TutorialListItem>>("/tutorials/", {
    query: {
      category: filters.category,
      difficulty: filters.difficulty,
      tag: filters.tag,
      ordering: filters.ordering,
      page: filters.page,
      page_size: filters.pageSize ?? 12,
    },
    revalidate: 300,
    tags: ["catalog"],
  });
}

export function getTutorial(slug: string): Promise<TutorialDetail> {
  return request<TutorialDetail>(`/tutorials/${encodeURIComponent(slug)}/`, {
    revalidate: 300,
    tags: [`tutorial:${slug}`, "catalog"],
  });
}

export function getChapter(tutorialSlug: string, chapterSlug: string): Promise<ChapterDetail> {
  return request<ChapterDetail>(
    `/tutorials/${encodeURIComponent(tutorialSlug)}/chapters/${encodeURIComponent(chapterSlug)}/`,
    {
      revalidate: 300,
      tags: [`chapter:${tutorialSlug}/${chapterSlug}`, `tutorial:${tutorialSlug}`, "catalog"],
    },
  );
}

export function searchCatalog(query: string, type = "all", page = 1): Promise<SearchResults> {
  return request<SearchResults>("/search/", {
    query: { q: query, type, page, page_size: 10 },
    noStore: true,
  });
}

export function getSearchSuggestions(query: string): Promise<SearchSuggestions> {
  return request<SearchSuggestions>("/search/suggestions/", {
    query: { q: query },
    noStore: true,
  });
}

export async function getAllTutorials(): Promise<TutorialListItem[]> {
  const first = await getTutorials({ pageSize: 24, ordering: "-published_at" });
  const results = [...first.results];
  const pages = Math.ceil(first.count / 24);

  for (let page = 2; page <= pages; page += 1) {
    const next = await getTutorials({ page, pageSize: 24, ordering: "-published_at" });
    results.push(...next.results);
  }

  return results;
}
