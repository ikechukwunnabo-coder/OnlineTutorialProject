import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Log in",
  description: "Log in to save bookmarks, track reading progress, and keep your place.",
  path: "/login",
  noIndex: true,
});

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const requested = firstValue(params.next);
  const nextPath =
    requested && requested.startsWith("/") && !requested.startsWith("//") ? requested : "/profile";

  return <LoginForm nextPath={nextPath} />;
}
