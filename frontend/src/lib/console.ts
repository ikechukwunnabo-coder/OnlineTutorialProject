import type { UserRole } from "@/lib/api/types";

export type ConsoleRole = Extract<UserRole, "editor" | "moderator" | "admin">;

const CONSOLE_ROLES: readonly UserRole[] = ["editor", "moderator", "admin"];
const CONTENT_EDITOR_ROLES: readonly UserRole[] = ["editor", "admin"];

export function canAccessConsole(role: UserRole | undefined | null): role is ConsoleRole {
  return Boolean(role && CONSOLE_ROLES.includes(role));
}

export function canEditConsoleContent(role: UserRole | undefined | null): boolean {
  return Boolean(role && CONTENT_EDITOR_ROLES.includes(role));
}

export function canManageConsole(role: UserRole | undefined | null): boolean {
  return role === "admin";
}
