import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactForm } from "@/components/contact-form";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact",
  description:
    "Ask a question about a tutorial, report a mistake, or suggest a topic for the programming library.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <section className="grid-paper border-b border-line">
        <div className="container-page py-10 lg:py-14">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Contact", path: "/contact" },
            ]}
          />
          <p className="eyebrow mt-8">Get in touch</p>
          <h1 className="display-title mt-4 max-w-3xl text-5xl sm:text-6xl">
            Ask a question. Report a mistake.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            If a chapter is unclear, an example does not work, or you want to suggest a topic, send
            a note. Include the tutorial or chapter name when you can.
          </p>
        </div>
      </section>

      <section className="container-page py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_19rem]">
          <div className="border-2 border-ink bg-paper-raised p-5 shadow-[5px_5px_0_0_var(--ink)] sm:p-7">
            <ContactForm />
          </div>

          <aside className="space-y-6">
            <div className="border-l-4 border-coral bg-paper-raised p-5">
              <p className="font-display text-lg font-bold tracking-[-0.03em]">Before you write</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>Check the chapter’s code example and expected output.</li>
                <li>Include your operating system and browser if something looks different.</li>
                <li>Paste the exact error message if you are stuck.</li>
              </ul>
            </div>

            <div className="border border-line p-5">
              <p className="meta-text text-cobalt">No account needed</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                You can send a message without creating an account. Account features arrive in a
                later phase.
              </p>
            </div>

            <div className="border border-line p-5">
              <p className="meta-text text-cobalt">Looking for a lesson?</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Browse the library or search by topic before sending a question.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/tutorials" className="tag tag-cobalt no-underline hover:bg-lime hover:text-on-lime">
                  Tutorials
                </Link>
                <Link href="/search" className="tag no-underline hover:bg-lime hover:text-on-lime">
                  Search
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
