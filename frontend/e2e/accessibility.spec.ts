import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publicPages = [
  "/",
  "/tutorials",
  "/tutorials/html-css-basics",
  "/tutorials/html-css-basics/what-html-does",
  "/categories",
  "/search",
  "/contact",
  "/login",
  "/register",
];

for (const path of publicPages) {
  test(`has no WCAG A/AA violations: ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1").first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations,
      JSON.stringify(
        results.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.map((node) => node.target),
        })),
        null,
        2,
      ),
    ).toEqual([]);
  });
}
