import { expect, test } from "@playwright/test";

test.describe("public catalog", () => {
  test("renders catalog content in initial HTML", async ({ page, request }) => {
    const home = await request.get("/");
    expect(home.ok()).toBeTruthy();
    expect(await home.text()).toContain("Start with");

    const tutorial = await request.get("/tutorials/html-css-basics");
    expect(tutorial.ok()).toBeTruthy();
    expect(await tutorial.text()).toContain("HTML and CSS Basics");

    const chapter = await request.get("/tutorials/html-css-basics/what-html-does");
    expect(chapter.ok()).toBeTruthy();
    const chapterHtml = await chapter.text();
    expect(chapterHtml).toContain("What HTML Does");
    expect(chapterHtml).toContain('id="chapter-title"');

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Start with");

    await page.goto("/tutorials", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Every tutorial");

    await page.goto("/tutorials/html-css-basics", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("HTML and CSS Basics");

    await page.goto("/tutorials/html-css-basics/what-html-does", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "What HTML Does" })).toBeVisible();
    await expect(page.locator("#chapter-reading")).toBeVisible();
  });

  test("search form finds a matching tutorial", async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" });

    const search = page.getByRole("combobox", {
      name: "Search tutorials, chapters, and categories",
    });
    await search.fill("html");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(/\/search\?q=html/);
    await expect(page.getByText(/Results for/)).toBeVisible();
    await expect(page.getByRole("link", { name: "HTML and CSS Basics" }).first()).toBeVisible();
  });

  test("keyboard users can skip to content and submit search", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await expect(skipLink).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main-content$/);

    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await page
      .getByRole("combobox", { name: "Search tutorials, chapters, and categories" })
      .focus();
    await page.keyboard.type("python");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=python/);
  });
});
