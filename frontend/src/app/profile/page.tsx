import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PasswordChangeForm } from "@/components/auth/password-change-form";
import { ProfileForm } from "@/components/auth/profile-form";
import { getCurrentUser } from "@/lib/api/server";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Your profile",
  description: "Manage your account details and password.",
  path: "/profile",
  noIndex: true,
});

export default async function ProfilePage() {
  const session = await getCurrentUser();

  if (!session.authenticated || !session.user) {
    redirect("/login?next=/profile");
  }

  return (
    <section className="grid-paper">
      <div className="container-page py-10 sm:py-14">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <ProfileForm user={session.user} />
          <PasswordChangeForm />
        </div>
      </div>
    </section>
  );
}
