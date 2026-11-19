import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Terms",
  description: "The terms that apply when you use this programming tutorial library.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="container-page py-10 lg:py-14">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Terms", path: "/terms" },
            ]}
          />
          <p className="eyebrow mt-8">Terms</p>
          <h1 className="display-title mt-4 text-5xl sm:text-6xl">Using this library.</h1>
          <p className="mt-4 meta-text text-muted">Last updated 15 November 2026</p>
        </div>
      </section>

      <section className="container-page py-12 lg:py-16">
        <div className="prose-lesson mx-auto max-w-3xl">
          <p>
            These terms apply when you use {siteConfig.name}. By using the site, you agree to them.
            If you do not agree, please do not use the site.
          </p>

          <h2>Educational content</h2>
          <p>
            The tutorials are provided for learning. They are not professional advice, and they do
            not guarantee a particular result, job, or income. Examples may need changes for your
            own environment.
          </p>

          <h2>Use the examples</h2>
          <p>
            You may read, adapt, and use the code examples in your own projects. You may not
            republish the lesson text as your own course or sell it as a standalone product without
            permission.
          </p>

          <h2>Acceptable use</h2>
          <ul>
            <li>Do not attempt to break, overload, or bypass the security of the site.</li>
            <li>Do not use the contact form to send spam, malware, or unlawful content.</li>
            <li>Do not scrape the site in a way that disrupts service for other readers.</li>
            <li>Do not misrepresent the source of the material.</li>
          </ul>

          <h2>Accounts</h2>
          <p>
            Account features are being introduced in a later phase. When available, you are
            responsible for keeping your credentials secure and for activity under your account.
            You may request deletion as described on the <Link href="/privacy">privacy page</Link>.
          </p>

          <h2>External links</h2>
          <p>
            Some pages may link to third-party tools or documentation. Those sites have their own
            terms and privacy practices. We are not responsible for their content or availability.
          </p>

          <h2>No warranty</h2>
          <p>
            The site is provided “as is” and “as available”. To the extent permitted by law, we make
            no warranties about accuracy, availability, or fitness for a particular purpose. Content
            may contain mistakes, and the site may be unavailable during maintenance.
          </p>

          <h2>Limitation of liability</h2>
          <p>
            To the extent permitted by law, {siteConfig.name} is not liable for indirect or
            consequential losses arising from use of the site or reliance on its content.
          </p>

          <h2>Changes</h2>
          <p>
            These terms may be updated as the project changes. The updated date at the top of this
            page will change when they do.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these terms can be sent through the{" "}
            <Link href="/contact">contact form</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
