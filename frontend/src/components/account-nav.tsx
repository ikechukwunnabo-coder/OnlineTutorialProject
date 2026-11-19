"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getMe, logout } from "@/lib/api/browser";
import type { UserProfile } from "@/lib/api/types";
import { canAccessConsole } from "@/lib/console";

export function AccountNav() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const data = await getMe();
        if (active) {
          setUser(data.user);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setChecked(true);
        }
      }
    }

    function handleAuthChange() {
      void loadSession();
    }

    void loadSession();
    window.addEventListener("bds:auth-changed", handleAuthChange);

    return () => {
      active = false;
      window.removeEventListener("bds:auth-changed", handleAuthChange);
    };
  }, []);

  async function handleLogout() {
    setBusy(true);
    try {
      await logout();
      setUser(null);
      router.push("/");
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  if (!checked) {
    return (
      <span
        aria-hidden="true"
        className="hidden h-8 w-20 animate-pulse border border-line bg-line/50 sm:block"
      />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="text-sm font-bold text-ink no-underline hover:text-cobalt">
          Log in
        </Link>
        <Link href="/register" className="button-primary hidden text-sm sm:inline-flex">
          Join
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/dashboard"
        className="hidden text-sm font-bold text-cobalt no-underline hover:text-cobalt-dark sm:inline"
      >
        My learning
      </Link>
      {canAccessConsole(user.role) ? (
        <Link
          href="/console"
          className="hidden text-sm font-bold text-cobalt no-underline hover:text-cobalt-dark sm:inline"
        >
          Console
        </Link>
      ) : null}
      <Link
        href="/profile"
        className="max-w-28 truncate text-sm font-bold text-ink no-underline hover:text-cobalt sm:max-w-40"
        title={`Signed in as ${user.display_name}`}
      >
        {user.display_name}
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        disabled={busy}
        className="border border-line-strong px-2 py-1 meta-text text-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
      >
        {busy ? "…" : "Log out"}
      </button>
    </div>
  );
}
