import { expect, test } from "@playwright/test";

test.skip(
  !process.env.E2E_PERFORMANCE,
  "Set E2E_PERFORMANCE=1 and run against a production build.",
);

test.use({ viewport: { width: 412, height: 915 } });

test("chapter LCP is under 2.5s on an emulated mobile viewport", async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as unknown as { __lcp: number };
    state.__lcp = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        state.__lcp = entry.startTime;
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });

  const response = await page.goto("/tutorials/html-css-basics/what-html-does", {
    waitUntil: "networkidle",
  });
  expect(response?.ok()).toBeTruthy();
  await page.waitForTimeout(1_000);

  const lcp = await page.evaluate(
    () => (window as unknown as { __lcp: number }).__lcp,
  );

  test.info().annotations.push({ type: "LCP", description: `${Math.round(lcp)}ms` });
  expect(lcp).toBeGreaterThan(0);
  expect(lcp).toBeLessThan(2_500);
});
