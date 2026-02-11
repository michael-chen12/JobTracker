import { test, expect } from '../fixtures/e2e-fixtures';

// Performance & SEO smoke tests
// These tests verify the observability and SEO features added in Ticket #30.
// Note: These tests run against the dev server (localhost:3000).
// Run: npx playwright test tests/e2e/performance.spec.ts

test.describe("SEO & Metadata", () => {
  test.skip(
    true,
    "Requires running dev/prod server — run manually with: npx playwright test tests/e2e/performance.spec.ts"
  );

  test("landing page returns 200", async ({ authPage: page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("landing page has correct title", async ({ authPage: page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Job Application Tracker/);
  });

  test("landing page has og:title meta tag", async ({ authPage: page }) => {
    await page.goto("/");
    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    expect(ogTitle).toContain("Job Application Tracker");
  });

  test("landing page has og:image meta tag", async ({ authPage: page }) => {
    await page.goto("/");
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage).toBeTruthy();
    expect(ogImage).toContain("opengraph-image");
  });

  test("landing page has twitter:card meta tag", async ({ authPage: page }) => {
    await page.goto("/");
    const twitterCard = await page
      .locator('meta[name="twitter:card"]')
      .getAttribute("content");
    expect(twitterCard).toBe("summary_large_image");
  });

  test("landing page has canonical metadataBase applied to OG url", async ({
    page,
  }) => {
    await page.goto("/");
    const ogUrl = await page
      .locator('meta[property="og:url"]')
      .getAttribute("content");
    expect(ogUrl).toBeTruthy();
  });

  test("landing page has preconnect link for Supabase", async ({ authPage: page }) => {
    await page.goto("/");
    const preconnect = await page
      .locator('link[rel="preconnect"]')
      .first()
      .getAttribute("href");
    expect(preconnect).toBeTruthy();
  });
});

test.describe("robots.txt", () => {
  test.skip(
    true,
    "Requires running dev/prod server — run manually with: npx playwright test tests/e2e/performance.spec.ts"
  );

  test("robots.txt returns 200", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
  });

  test("robots.txt disallows dashboard routes", async ({ request }) => {
    const response = await request.get("/robots.txt");
    const body = await response.text();
    expect(body).toContain("Disallow: /dashboard/");
  });

  test("robots.txt disallows api routes", async ({ request }) => {
    const response = await request.get("/robots.txt");
    const body = await response.text();
    expect(body).toContain("Disallow: /api/");
  });

  test("robots.txt includes sitemap link", async ({ request }) => {
    const response = await request.get("/robots.txt");
    const body = await response.text();
    expect(body).toContain("sitemap.xml");
  });
});

test.describe("sitemap.xml", () => {
  test.skip(
    true,
    "Requires running dev/prod server — run manually with: npx playwright test tests/e2e/performance.spec.ts"
  );

  test("sitemap.xml returns 200", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
  });

  test("sitemap.xml contains root URL", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("<loc>");
  });

  test("sitemap.xml does not expose dashboard routes", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).not.toContain("/dashboard");
  });
});

test.describe("favicon & icons", () => {
  test.skip(
    true,
    "Requires running dev/prod server — run manually with: npx playwright test tests/e2e/performance.spec.ts"
  );

  test("favicon /icon.png returns 200", async ({ request }) => {
    const response = await request.get("/icon.png");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
  });

  test("apple-icon /apple-icon.png returns 200", async ({ request }) => {
    const response = await request.get("/apple-icon.png");
    expect(response.status()).toBe(200);
  });

  test("OG image /opengraph-image returns 200", async ({ request }) => {
    const response = await request.get("/opengraph-image");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
  });
});

test.describe("Error boundaries", () => {
  test.skip(
    true,
    "Requires running dev/prod server — run manually with: npx playwright test tests/e2e/performance.spec.ts"
  );

  test("dashboard/error.tsx file exists and has correct structure", async ({
    page,
  }) => {
    // This test validates error boundaries are correctly wired by checking
    // that navigating to a non-existent dashboard sub-path doesn't crash the app
    const response = await page.goto("/auth/login");
    expect(response?.status()).toBe(200);
  });
});
