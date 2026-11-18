import { expect, test } from "@playwright/test";

test("contact form validates and accepts a message", async ({ page }) => {
  await page.goto("/contact", { waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Tell us your name.")).toBeVisible();
  await expect(page.getByText("Add a short subject.")).toBeVisible();

  await page.getByLabel("Your name").fill("E2E Visitor");
  await page.getByLabel("Email address").fill(`visitor-${Date.now()}@example.com`);
  await page.getByLabel("Subject").fill("Question about the HTML chapter");
  await page
    .getByLabel("What can we help with?")
    .fill("The first HTML chapter was clear. I would like to see more examples.");
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByRole("status")).toContainText("your message has been received");
  await expect(page.getByLabel("Your name")).toHaveValue("");
});
