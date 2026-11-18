import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Create an account",
  description: "Create a free account to save bookmarks and track your reading progress.",
  path: "/register",
  noIndex: true,
});

export default function RegisterPage() {
  return <RegisterForm />;
}
