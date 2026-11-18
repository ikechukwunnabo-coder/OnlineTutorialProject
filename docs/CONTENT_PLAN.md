# Content Plan and Editorial Workflow — Ben Digital Solution

**Version:** 1.0
**Created:** 2026-11-12 (Phase 0)
**Owner:** Site owner (Admin role)
**Scope:** Release 1 MVP content; Release 2/3 content is outlined only.

This plan exists so that the platform launches with real, correct, beginner-appropriate lessons instead of an empty shell. It defines what content is produced, who produces it, how it is reviewed, and how quality is proven before publishing.

---

## 1. Audience and content promise

**Primary audience:** absolute beginners with no prior programming experience, many of whom study on a mid-range phone in short sessions.

**Content promise:** every chapter is self-contained, states its prerequisites, teaches one main idea, includes at least one complete working example with its output, and ends with a small practice task and a summary.

**Reading level target:** plain English; short sentences; technical terms defined on first use.

**Out of scope for R1:** intermediate/advanced material, video courses, quizzes (R2), downloadable certificates (R2), community discussion (R2), non-English content.

## 2. Content model

Hierarchy: **Category → Tutorial → Chapter**.

- **Category** — subject area (for example, Web Development).
- **Tutorial** — an ordered beginner course inside one category (for example, HTML & CSS Basics).
- **Chapter** — one lesson inside a tutorial, authored in Markdown, with an ordered list of code examples.

Chapter fields: title, slug, summary, Markdown body, difficulty, estimated reading time, prerequisites, learning outcomes, author, published date, updated date, status (draft/published/archived), chapter order.

Code example fields: language, title, source, display order, optional expected output.

Slugs are unique within their parent scope. A published slug change must create a 301 redirect (R1).

## 3. R1 content inventory

Launch target: **20 published chapters**, **5 tutorials**, **4 categories**. The 20-chapter count excludes demo/seed content.

| Category | Tutorial | Chapters (4 per tutorial) | Chapter learning outcome |
|---|---|---|---|
| Web Development | HTML & CSS Basics | 1. Your First Web Page | Create and open a valid HTML page; understand tags, elements, and attributes |
| Web Development | HTML & CSS Basics | 2. Text, Links, and Lists | Structure text, create working links, build ordered and unordered lists |
| Web Development | HTML & CSS Basics | 3. Images and Page Structure | Add images with alt text; use header, nav, main, section, and footer landmarks |
| Web Development | HTML & CSS Basics | 4. CSS Basics and the Box Model | Apply selectors, colours, spacing, and the box model to style a page |
| Web Development | JavaScript Basics | 1. Running JavaScript | Run JavaScript in a browser console and from an HTML file; read errors |
| Web Development | JavaScript Basics | 2. Variables and Data Types | Declare variables; use strings, numbers, and booleans without type confusion |
| Web Development | JavaScript Basics | 3. Conditions and Loops | Write `if`/`else` logic and `for`/`while` loops; avoid infinite loops |
| Web Development | JavaScript Basics | 4. Functions, Arrays, and Objects | Define functions; store and iterate collections; read and update object properties |
| Programming | Python Basics | 1. Getting Started with Python | Install/run Python; use the REPL; run a `.py` file |
| Programming | Python Basics | 2. Variables and Data Types | Use variables, strings, numbers, lists, and dictionaries correctly |
| Programming | Python Basics | 3. Control Flow | Write conditionals and loops with correct indentation and boundaries |
| Programming | Python Basics | 4. Functions and Modules | Define functions with parameters and return values; import modules |
| Databases | SQL Basics | 1. What Is a Database? | Explain tables, rows, columns, keys, and why relational databases exist |
| Databases | SQL Basics | 2. Reading Data with SELECT | Select columns and rows; use aliases and `DISTINCT` |
| Databases | SQL Basics | 3. Filtering and Sorting | Filter with `WHERE`, combine conditions, sort with `ORDER BY`, limit results |
| Databases | SQL Basics | 4. Combining Tables with JOINs | Explain relationships; write inner joins and understand NULL behaviour |
| Developer Tools | Git Basics | 1. Why Version Control? | Explain commits and history; initialise a repository |
| Developer Tools | Git Basics | 2. Commits and History | Stage, commit, inspect history, and write useful commit messages |
| Developer Tools | Git Basics | 3. Branching and Merging | Create and switch branches; merge; resolve a simple conflict |
| Developer Tools | Git Basics | 4. Working with GitHub | Create a remote repository; push, pull, and open a pull request |

### 3.1 Categories seeded in R1

| Category | Slug | Icon identifier (placeholder set of allowed names, finalised in Phase 5) |
|---|---|---|
| Web Development | `web-development` | `code` |
| Programming | `programming` | `terminal` |
| Databases | `databases` | `database` |
| Developer Tools | `developer-tools` | `tools` |

Later suggested subjects (React, Django, Java, C#, PHP, DevOps, Data Science, AI/ML) are **not seeded** in R1: empty categories create a poor first impression and thin navigation. They are added in R2/R3 when content exists.

### 3.2 Difficulty taxonomy

- `beginner` — R1 content only.
- `intermediate` — reserved for R2.
- `advanced` — reserved for R3.

Every R1 tutorial is `beginner`; chapters inherit or narrow the tutorial difficulty.

### 3.3 Estimated reading times

Each chapter targets **5–8 minutes** of reading. Estimated reading time is computed from word count at publication time and stored (documented formula in Phase 2: words ÷ 200, rounded up, minimum 1 minute).

## 4. Chapter template (mandatory structure)

1. **Title** — one concept, 2–6 words.
2. **What you will learn** — 2–4 outcome bullets.
3. **Before you start** — explicit prerequisites or "No previous experience needed."
4. **Main explanation** — short sections with descriptive headings (H2/H3), one idea per section.
5. **Worked example** — complete code, language label, and the actual output or result.
6. **Try it yourself** — one small exercise with expected behaviour.
7. **Common mistakes** — 1–3 beginner errors and fixes.
8. **Summary** — 3–5 bullets.
9. **Next step** — link to the next chapter or a relevant tutorial.

Headings must form a logical hierarchy (one H1, then H2/H3) because the table of contents is generated from them.

## 5. Code example policy

- Code is stored as ordered `CodeExample` records, separate from prose; it is read-only in R1.
- Code is never executed on the application server.
- Every example is run locally by the author before publication; the observed output is recorded as the expected output.
- Examples are minimal and complete: no ellipses, no undefined variables, no pseudo-code presented as runnable.
- Language labels use a fixed allowlist (`html`, `css`, `javascript`, `python`, `sql`, `bash`, `text`).
- Copy action copies the exact stored source, preserving whitespace.
- Line highlighting and syntax highlighting are display concerns; the underlying source is authoritative.
- Secrets, real personal data, and paid-service credentials never appear in examples.

## 6. Media and embed policy

- Images require meaningful alt text; decorative images are explicitly marked as decorative in the renderer.
- Accepted types and size limits are enforced on upload (exact values in Phase 1/2 design; default: JPEG/PNG/WebP, maximum 2 MB).
- Images are optimised before upload; screenshots must be legible at mobile width.
- Video embeds only from an allowlist (YouTube and Vimeo) parsed by URL; never arbitrary iframe HTML.
- No autoplaying audio or motion; animation respects reduced-motion preferences.

## 7. Editorial workflow (R1)

```text
Idea/outline → Draft (`/console` or admin) → Author self-review → Technical verification
→ Quality checklist → Publish → Maintain (errata/update) → Archive/Unpublish
```

### 7.1 States and responsibilities

| State | Meaning | Allowed actions |
|---|---|---|
| Draft | Incomplete or unverified content; never public | Edit, preview, delete |
| Published | Passed checklist; visible publicly and in sitemap | Edit (creates updated date), unpublish, archive |
| Archived | Retired content; not public | Restore to draft or delete |

The owner is the sole author and holds Admin. The Editor role can create and edit content in `/console` or Django admin but cannot publish or delete; no second editor is assigned in R1. The role is defined so a future collaborator can be added without redesign.

### 7.2 Revision strategy

R1 uses Django admin history as the revision record and `AdministrativeAuditLog` for console create/update/delete actions. Full `ContentRevision` storage and a formal review workflow are R2 features (ADR-0006). Authors must still keep the published Markdown recoverable from admin history before destructive edits.

### 7.3 Publishing checklist (mandatory, recorded per chapter)

- [ ] Chapter follows the mandatory template.
- [ ] Every code example was executed; output matches the text.
- [ ] No placeholder text, TODOs, ellipses, or undefined variables.
- [ ] Prerequisites are true for the target audience.
- [ ] Headings are hierarchical and descriptive.
- [ ] All images have correct alt text; embeds use allowlisted URLs.
- [ ] Internal links resolve; external links return 200.
- [ ] Title, slug, meta description, and summary are complete and unique.
- [ ] Reading time and difficulty are set.
- [ ] Plain-language review complete; jargon defined.
- [ ] No copied third-party content; any quotation is attributed.
- [ ] No secrets or personal data in prose, code, or screenshots.
- [ ] Mobile-width read-through completed.
- [ ] Updated date set correctly.

Publication is blocked internally until every checklist item is true. The checklist outcome is recorded in the chapter's admin notes.

## 8. Production cadence and schedule

| Milestone | Content requirement |
|---|---|
| Phase 3 (backend API) | 5 chapters (one per tutorial) available as draft/published test content |
| Phase 5 (frontend build) | 10 chapters published |
| Phase 6 (learner features) | 15 chapters published |
| Phase 7 (R1 release gate) | 20 chapters published, 5 tutorials, 4 categories, all checklists complete |

Target authoring rate: **2 chapters per week**, allowing one revision week before the release gate. If the rate slips, the owner chooses explicitly between reducing the MVP chapter count, delaying the gate, or launching with fewer tutorials; silent scope changes are not allowed.

## 9. Demo and seed data

- The seed command creates clearly marked demo content (for example, titles prefixed "Demo:" and a stored demo flag).
- Demo content is excluded from launch content counts, sitemap eligibility, and public homepage featured slots.
- Demo users are not created; no fake testimonials, ratings, learner counts, or authors are ever seeded.
- Demo content is removable with one documented command before production launch.

## 10. SEO content requirements

Every public category, tutorial, and chapter has:

- unique title (50–60 characters target) and meta description (140–160 characters target);
- clean slug consistent with the hierarchy;
- canonical URL;
- Open Graph title, description, and image where available;
- accurate structured data (Course, Article, BreadcrumbList, Organization as applicable);
- publication and update dates that reflect reality;
- descriptive internal links with meaningful anchor text.

No fabricated author names, dates, ratings, or course details. Drafts, auth pages, dashboards, and internal search URLs are excluded from indexing and sitemaps.

## 11. Accessibility content requirements

- One H1 per page; no skipped heading levels.
- Descriptive link text (never "click here").
- Alt text communicates purpose, not filename.
- Code blocks are labelled with language and remain keyboard-scrollable.
- Instructions do not rely on colour, position, or shape alone.
- Tables have header rows.
- Plain-language sentence structure; abbreviations expanded on first use.

## 12. Legal and licence

- All lessons, code examples, and images are original work owned by the site owner unless explicitly attributed.
- No scraping, no copying of W3Schools, freeCodeCamp, GeeksforGeeks, or any third-party course content, branding, or visual identity.
- Short quotations are attributed with a source link.
- Privacy page documents contact-form data, account data, retention, deletion, and email use.
- Terms page covers acceptable use, content licence, and limitation of liability (owner-reviewed before launch).
- External images and embeds must be licensed for use; link-only references are preferred where rights are unclear.

## 13. Errata and maintenance

- Readers can report errors through the contact form (R1); comments are R2.
- Confirmed errors are fixed within 5 working days; the chapter updated date changes.
- Factual or code-breaking errors trigger a re-read of the full chapter.
- Deprecated APIs or tool versions are reviewed quarterly; a "last verified" note may be added to the chapter.
- Unpublishing requires a redirect decision: replace with an archived notice or 301 to the closest published content.

## 14. Content success measures

| Measure | Target | When measured |
|---|---|---|
| Published chapters | 20 | Phase 7 gate |
| Chapters passing checklist | 100% | Phase 7 gate |
| Broken internal links | 0 | Phase 7 gate |
| Code examples with verified output | 100% | Continuous |
| p75 mobile LCP on chapter pages | < 2.5 s | Phase 7 |
| Search-to-chapter click-through (manual review) | Chapter results appear for exact chapter titles | Phase 7 |
| Accessibility violations (axe critical/serious) | 0 on key pages | Phase 7 |

## 15. Deferred content work (explicitly out of R1 scope)

- Quizzes and explanations per tutorial (R2).
- Blog posts, RSS, and editorial calendar (R2).
- Certificates and course-completion rules (R2).
- Comments and community moderation guidance (R2).
- Newsletter copy and onboarding sequence (R3).
- Additional categories and intermediate/advanced tracks (R2/R3).
- Translations and localisation (out of scope; model must not preclude it).
