import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Privacy",
  description:
    "What information this site collects, why it is collected, and how to ask for correction or deletion.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="container-page py-10 lg:py-14">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Privacy", path: "/privacy" },
            ]}
          />
          <p className="eyebrow mt-8">Privacy</p>
          <h1 className="display-title mt-4 text-5xl sm:text-6xl">What we collect, and why.</h1>
          <p className="mt-4 meta-text text-muted">Last updated 15 November 2026</p>
        </div>
      </section>

      <section className="container-page py-12 lg:py-16">
        <div className="prose-lesson mx-auto max-w-3xl">
          <p>
            This page explains how {siteConfig.name} handles information. It is written to be
            readable, not to hide behind legal language.
          </p>

          <h2>Information you send us</h2>
          <p>
            If you use the contact form, we receive the name, email address, subject, and message
            you submit. We also store a one-way hash of the request IP address to limit spam and
            abuse. We do not store the raw IP address with the message.
          </p>

          <h2>Account information</h2>
          <p>
            Account features are being introduced in a later phase. When they are available, we
            will store the email address, display name, optional bio, password hash, and the
            learning data you choose to save, such as bookmarks and chapter progress. Passwords are
            stored as hashes, never as plain text.
          </p>

          <h2>Cookies</h2>
          <p>
            The public library does not use advertising or cross-site tracking cookies. After you
            sign in, the site uses a session cookie and a CSRF cookie to keep you signed in and to
            protect forms. These cookies are required for account features to work.
          </p>

          <h2>How we use information</h2>
          <ul>
            <li>To reply to contact messages.</li>
            <li>To provide and secure account features when they launch.</li>
            <li>To understand and fix technical problems.</li>
            <li>To comply with legal obligations when required.</li>
          </ul>

          <h2>Sharing</h2>
          <p>
            We do not sell personal information. In production, hosting and email providers may
            process data on our behalf so the site can operate. We may disclose information if the
            law requires it or if it is necessary to protect the service and its users.
          </p>

          <h2>Retention</h2>
          <p>
            Contact messages are kept only as long as needed to respond and maintain a record of
            content corrections. Account data is kept until you ask for deletion, subject to legal
            or security requirements. Server logs are kept for a limited operational period.
          </p>

          <h2>Your choices</h2>
          <p>
            You can ask to access, correct, or delete personal information by using the{" "}
            <Link href="/contact">contact form</Link>. Include the email address you used so we can
            find the right record. We may need to verify the request before acting on it.
          </p>

          <h2>Children</h2>
          <p>
            The site is not directed to children under 13. If you believe a child has submitted
            personal information, contact us and we will remove it.
          </p>

          <h2>Changes</h2>
          <p>
            If this policy changes, the updated date at the top of this page will change. Material
            changes will be described in plain language on this page.
          </p>
        </div>
      </section>
    </>
  );
}
