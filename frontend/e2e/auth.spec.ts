import { expect, test } from "@playwright/test";

import { verificationToken } from "./support/backend";

test.describe("authentication", () => {
  test("register, verify, log out, log in, and update profile", async ({ page }) => {
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const email = `ui-${unique}@example.com`;
    const password = "E2ePassword123!";
    const displayName = `UI Learner ${unique.slice(-4)}`;

    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Display name").fill(displayName);
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByRole("heading", { name: "Check your email." })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Check your email");

    const token = verificationToken(email);
    await page.goto(`/verify-email?token=${encodeURIComponent(token)}`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByRole("heading", { name: `Welcome, ${displayName}.` })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Email verified");
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();

    await page.getByRole("link", { name: "Go to your profile" }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole("heading", { name: displayName })).toBeVisible();
    await expect(page.getByText("Email verified")).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();

    await page.goto("/login?next=/profile", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole("heading", { name: displayName })).toBeVisible();

    await page.getByLabel(/Bio/).fill("Learning HTML, CSS, and JavaScript from the beginning.");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Profile saved.")).toBeVisible();
  });

  test("protected dashboard redirects anonymous visitors", async ({ page, request }) => {
    const dashboard = await request.get("/dashboard", { maxRedirects: 0 });
    expect([200, 307]).toContain(dashboard.status());

    if (dashboard.status() === 200) {
      expect(await dashboard.text()).toContain("NEXT_REDIRECT;replace;/login?next=/dashboard");
    } else {
      expect(dashboard.headers()["location"]).toBe("/login?next=/dashboard");
    }

    await page.goto("/login?next=/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Log in." })).toBeVisible();
  });
});
