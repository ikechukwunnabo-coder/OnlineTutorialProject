import type { Metadata } from "next";

import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Verify your email",
  description: "Confirm your email address to finish setting up your account.",
  path: "/verify-email",
  noIndex: true,
});

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;

  return <VerifyEmailForm token={firstValue(params.token) ?? ""} />;
}
