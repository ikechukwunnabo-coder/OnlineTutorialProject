import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Reset password",
  description: "Choose a new password for your account.",
  path: "/reset-password",
  noIndex: true,
});

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string | string[]; token?: string | string[] }>;
}) {
  const params = await searchParams;

  return (
    <ResetPasswordForm
      uid={firstValue(params.uid) ?? ""}
      token={firstValue(params.token) ?? ""}
    />
  );
}
