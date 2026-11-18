import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = pageMetadata({
  title: "About",
  description:
    "Why this programming library exists, how the lessons are written, and what you will and will not find here.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <section className="grid-paper border-b border-line">
        <div className="container-page py-10 lg:py-14">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "About", path: "/about" },
            ]}
          />
          <p className="eyebrow mt-8">About the library</p>
          <h1 className="display-title mt-4 max-w-4xl text-5xl sm:text-6xl">
            Programming should not feel like a locked door.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {siteConfig.name} is a beginner-first teaching project. The goal is simple: explain the
            small steps clearly, show working examples, and give you room to practice without
            noise.
          </p>
        </div>
      </section>

      <section className="container-page py-12 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_20rem]">
          <div className="prose-lesson max-w-3xl">
            <h2>Why this exists</h2>
            <p>
              Most programming material assumes you already know the vocabulary. A tutorial says
              “just add an event listener” before explaining what an event is. A reference page
              lists every option but not the one you need. Beginners end up copying code they do
              not understand.
            </p>
            <p>
              This library takes a different pace. Each chapter introduces one idea, connects it to
              something visible, and stops. The next chapter builds on it. You are expected to read
              slowly and type the examples yourself.
            </p>

            <h2>What you will find</h2>
            <ul>
              <li>Short chapters with a clear stopping point.</li>
              <li>Complete examples, not fragments that cannot run.</li>
              <li>Plain-language explanations of the “why”, not only the syntax.</li>
              <li>Accessible pages that work on small screens and with a keyboard.</li>
              <li>Real content counts, with no invented learner numbers or reviews.</li>
            </ul>

            <h2>What you will not find</h2>
            <ul>
              <li>Fake urgency, streak pressure, or dark-pattern nudges.</li>
              <li>Certificates or promises about job outcomes.</li>
              <li>A code execution sandbox in this release.</li>
              <li>Comments, quizzes, or community features yet.</li>
            </ul>

            <h2>Who it is for</h2>
            <p>
              People starting from zero, career switchers rebuilding the basics, hobbyists who want
              to understand a tool, and teachers looking for a clear sequence they can adapt.
            </p>

            <h2>How lessons are made</h2>
            <p>
              A chapter starts as a narrow question: what is the smallest useful thing someone needs
              to know next? The explanation is drafted, the example is run, and the chapter is
              edited until the steps are reproducible. Content is published only when it is ready to
              be read in sequence.
            </p>
            <p>
              Mistakes still happen. If an example does not work or an explanation is unclear,{" "}
              <Link href="/contact">send a note</Link> with the chapter name.
            </p>
          </div>

          <aside className="space-y-6">
            <div className="border-2 border-ink bg-lime p-5 shadow-[4px_4px_0_0_var(--ink)]">
              <p className="font-mono text-xs text-[#35420a]">The short version</p>
              <p className="mt-2 font-display text-2xl font-bold leading-tight tracking-[-0.04em]">
                Read one chapter. Type the example. Change one thing.
              </p>
            </div>
            <div className="border border-line p-5">
              <p className="font-mono text-xs text-cobalt">Start here</p>
              <div className="mt-3 space-y-2 text-sm">
                <Link href="/tutorials" className="block font-bold text-ink no-underline hover:text-cobalt">
                  Browse tutorials →
                </Link>
                <Link href="/categories" className="block font-bold text-ink no-underline hover:text-cobalt">
                  Browse categories →
                </Link>
                <Link href="/contact" className="block font-bold text-ink no-underline hover:text-cobalt">
                  Contact the project →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
