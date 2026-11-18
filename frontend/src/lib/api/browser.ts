import { ApiError, parseApiError } from "./errors";
import type {
  Bookmark,
  BookmarkPage,
  ChapterDetail,
  ConsoleCategory,
  ConsoleCategoryInput,
  ConsoleChapter,
  ConsoleChapterInput,
  ConsoleTutorial,
  ConsoleTutorialInput,
  ContactInput,
  ContactResponse,
  LoginInput,
  LoginResponse,
  MeResponse,
  MessageResponse,
  PasswordChangeInput,
  PasswordResetConfirmInput,
  ProfileInput,
  ProgressOverview,
  ProgressRecord,
  ProgressUpdateInput,
  RegisterInput,
  SearchSuggestions,
  UserProfile,
  VerifyEmailResponse,
} from "./types";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1").replace(/\/$/, "");
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }
  const prefix = `${name}=`;
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : undefined;
}

function expireCookie(name: string): void {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
}

export async function ensureCsrfCookie(): Promise<string> {
  expireCookie("csrftoken");

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/auth/csrf/`, {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new ApiError("We could not reach the server. Please try again.", {
      status: 503,
      code: "network_error",
    });
  }

  if (!response.ok) {
    throw new ApiError("We could not prepare a secure request. Please try again.", {
      status: response.status,
    });
  }

  const csrfToken = response.headers.get("X-CSRFToken") ?? readCookie("csrftoken");
  if (!csrfToken) {
    throw new ApiError("We could not prepare a secure request. Please try again.", {
      status: 503,
      code: "csrf_cookie_missing",
    });
  }
  return csrfToken;
}

export async function browserRequest<T>(
  path: string,
  init: RequestInit = {},
  csrfToken?: string,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const method = (init.method ?? "GET").toUpperCase();
  if (!SAFE_METHODS.has(method)) {
    const token = csrfToken ?? readCookie("csrftoken");
    if (token) {
      headers.set("X-CSRFToken", token);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      credentials: "include",
      cache: init.cache ?? "no-store",
    });
  } catch {
    throw new ApiError("We could not reach the server. Please try again.", {
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

async function unsafeRequest<T>(path: string, init: RequestInit): Promise<T> {
  const csrfToken = await ensureCsrfCookie();
  return browserRequest<T>(path, init, csrfToken);
}

export async function submitContact(input: ContactInput): Promise<ContactResponse> {
  return unsafeRequest<ContactResponse>("/contact/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getMe(): Promise<MeResponse> {
  return browserRequest<MeResponse>("/auth/me/", { cache: "no-store" });
}

export function login(input: LoginInput): Promise<LoginResponse> {
  return unsafeRequest<LoginResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout(): Promise<void> {
  return unsafeRequest<void>("/auth/logout/", { method: "POST" });
}

export function register(input: RegisterInput): Promise<MessageResponse> {
  return unsafeRequest<MessageResponse>("/auth/register/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  return unsafeRequest<VerifyEmailResponse>("/auth/verify-email/", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function resendVerification(email?: string): Promise<MessageResponse> {
  return unsafeRequest<MessageResponse>("/auth/resend-verification/", {
    method: "POST",
    body: JSON.stringify(email ? { email } : {}),
  });
}

export function requestPasswordReset(email: string): Promise<MessageResponse> {
  return unsafeRequest<MessageResponse>("/auth/password/reset/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function confirmPasswordReset(
  input: PasswordResetConfirmInput,
): Promise<MessageResponse> {
  return unsafeRequest<MessageResponse>("/auth/password/reset/confirm/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProfile(input: ProfileInput): Promise<UserProfile> {
  return unsafeRequest<UserProfile>("/auth/profile/", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function changePassword(input: PasswordChangeInput): Promise<MessageResponse> {
  return unsafeRequest<MessageResponse>("/auth/password/change/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deactivateAccount(password: string): Promise<void> {
  return unsafeRequest<void>("/auth/account/deactivate/", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export function deleteAccount(password: string): Promise<void> {
  return unsafeRequest<void>("/auth/account/", {
    method: "DELETE",
    body: JSON.stringify({ password, confirm: "DELETE" }),
  });
}

export function getBrowserSuggestions(
  query: string,
  signal?: AbortSignal,
): Promise<SearchSuggestions> {
  return browserRequest<SearchSuggestions>(
    `/search/suggestions/?q=${encodeURIComponent(query)}`,
    { signal },
  );
}

export function getChapterWithSession(
  tutorialSlug: string,
  chapterSlug: string,
): Promise<ChapterDetail> {
  return browserRequest<ChapterDetail>(
    `/tutorials/${encodeURIComponent(tutorialSlug)}/chapters/${encodeURIComponent(chapterSlug)}/`,
  );
}

export function getBookmarks(page = 1, pageSize = 20): Promise<BookmarkPage> {
  return browserRequest<BookmarkPage>(
    `/bookmarks/?page=${page}&page_size=${pageSize}`,
  );
}

export function addBookmark(chapterId: number): Promise<Bookmark> {
  return unsafeRequest<Bookmark>("/bookmarks/", {
    method: "POST",
    body: JSON.stringify({ chapter: chapterId }),
  });
}

export function removeBookmark(chapterId: number): Promise<void> {
  return unsafeRequest<void>(`/bookmarks/${chapterId}/`, { method: "DELETE" });
}

export function getProgress(): Promise<ProgressOverview> {
  return browserRequest<ProgressOverview>("/progress/");
}

export function saveProgress(
  chapterId: number,
  input: ProgressUpdateInput,
): Promise<ProgressRecord> {
  return unsafeRequest<ProgressRecord>(`/progress/${chapterId}/`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function createConsoleCategory(input: ConsoleCategoryInput): Promise<ConsoleCategory> {
  return unsafeRequest<ConsoleCategory>("/admin/content/categories/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateConsoleCategory(
  id: number,
  input: ConsoleCategoryInput,
): Promise<ConsoleCategory> {
  return unsafeRequest<ConsoleCategory>(`/admin/content/categories/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function createConsoleTutorial(input: ConsoleTutorialInput): Promise<ConsoleTutorial> {
  return unsafeRequest<ConsoleTutorial>("/admin/content/tutorials/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateConsoleTutorial(
  id: number,
  input: ConsoleTutorialInput,
): Promise<ConsoleTutorial> {
  return unsafeRequest<ConsoleTutorial>(`/admin/content/tutorials/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function createConsoleChapter(input: ConsoleChapterInput): Promise<ConsoleChapter> {
  return unsafeRequest<ConsoleChapter>("/admin/content/chapters/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateConsoleChapter(
  id: number,
  input: ConsoleChapterInput,
): Promise<ConsoleChapter> {
  return unsafeRequest<ConsoleChapter>(`/admin/content/chapters/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteConsoleContent(kind: "categories" | "tutorials" | "chapters", id: number): Promise<void> {
  return unsafeRequest<void>(`/admin/content/${kind}/${id}/`, { method: "DELETE" });
}
