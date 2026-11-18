import { cookies } from "next/headers";

import { ApiError, parseApiError } from "./errors";
import type {
  BookmarkPage,
  ConsoleCategory,
  ConsoleChapter,
  ConsoleOverview,
  ConsoleTutorial,
  MeResponse,
  ProgressOverview,
} from "./types";

const API_BASE = (process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8000/api/v1").replace(
  /\/$/,
  "",
);
const REQUEST_TIMEOUT_MS = 8_000;

async function sessionCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

async function serverRequest<T>(path: string): Promise<T> {
  const cookieHeader = await sessionCookieHeader();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new ApiError("We could not reach the account service.", {
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

export async function getCurrentUser(): Promise<MeResponse> {
  const cookieHeader = await sessionCookieHeader();

  if (!cookieHeader) {
    return { authenticated: false, user: null };
  }

  return serverRequest<MeResponse>("/auth/me/");
}

export function getBookmarks(page = 1, pageSize = 50): Promise<BookmarkPage> {
  return serverRequest<BookmarkPage>(`/bookmarks/?page=${page}&page_size=${pageSize}`);
}

export function getProgress(): Promise<ProgressOverview> {
  return serverRequest<ProgressOverview>("/progress/");
}

export function getConsoleOverview(): Promise<ConsoleOverview> {
  return serverRequest<ConsoleOverview>("/admin/overview/");
}

export function getConsoleCategories(): Promise<ConsoleCategory[]> {
  return serverRequest<ConsoleCategory[]>("/admin/content/categories/");
}

export function getConsoleCategory(id: number): Promise<ConsoleCategory> {
  return serverRequest<ConsoleCategory>(`/admin/content/categories/${id}/`);
}

export function getConsoleTutorials(): Promise<ConsoleTutorial[]> {
  return serverRequest<ConsoleTutorial[]>("/admin/content/tutorials/");
}

export function getConsoleTutorial(id: number): Promise<ConsoleTutorial> {
  return serverRequest<ConsoleTutorial>(`/admin/content/tutorials/${id}/`);
}

export function getConsoleChapters(): Promise<ConsoleChapter[]> {
  return serverRequest<ConsoleChapter[]>("/admin/content/chapters/");
}

export function getConsoleChapter(id: number): Promise<ConsoleChapter> {
  return serverRequest<ConsoleChapter>(`/admin/content/chapters/${id}/`);
}
