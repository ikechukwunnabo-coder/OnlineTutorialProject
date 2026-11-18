import { expect, test } from "@playwright/test";

import { createVerifiedLearner } from "./support/backend";

test.describe("learner bookmarks and progress", () => {
  test("bookmark and complete a chapter, then see it on the dashboard", async ({
    page,
    request,
  }) => {
    const learner = await createVerifiedLearner(request);

    await page.goto("/login?next=/tutorials/html-css-basics/what-html-does", {
      waitUntil: "domcontentloaded",
    });
    await page.getByLabel("Email address").fill(learner.email);
    await page.getByLabel("Password", { exact: true }).fill(learner.password);
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL(/\/tutorials\/html-css-basics\/what-html-does$/);
    await expect(page.getByRole("heading", { name: "Your learning state" })).toBeVisible();

    await page.getByRole("button", { name: "Bookmark chapter" }).click();
    await expect(page.getByRole("button", { name: "Bookmarked" })).toBeVisible();
    await expect(page.getByText("Chapter bookmarked.")).toBeVisible();

    await page.getByRole("button", { name: "Mark chapter complete" }).click();
    await expect(page.getByRole("button", { name: "Completed" })).toBeVisible();
    await expect(page.getByText("Chapter marked complete.")).toBeVisible();

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: `Welcome back, ${learner.displayName}.` }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /What HTML Does/ })).toBeVisible();
    await expect(page.getByText("HTML and CSS Basics").first()).toBeVisible();
    await expect(page.getByText("1 chapter")).toBeVisible();

    await page.reload();
    await expect(page.getByRole("link", { name: /What HTML Does/ })).toBeVisible();

    await page.goto("/tutorials/html-css-basics/what-html-does", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("button", { name: "Completed" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bookmarked" })).toBeVisible();
  });

  test("anonymous learners see login prompts instead of controls", async ({ page }) => {
    await page.goto("/tutorials/html-css-basics/what-html-does", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByText("Keep your place in this chapter.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Bookmark chapter" })).toHaveCount(0);

    await page.getByRole("link", { name: "Log in" }).last().click();
    await expect(page).toHaveURL(/\/login\?next=/);
  });
});
