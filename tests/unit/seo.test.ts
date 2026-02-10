import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("robots.ts", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("disallows dashboard routes", async () => {
    const { default: robots } = await import("../../src/app/robots");
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const disallowed = rules.flatMap((r) =>
      Array.isArray(r.disallow) ? r.disallow : r.disallow ? [r.disallow] : []
    );
    expect(disallowed).toContain("/dashboard/");
  });

  it("disallows API routes", async () => {
    const { default: robots } = await import("../../src/app/robots");
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const disallowed = rules.flatMap((r) =>
      Array.isArray(r.disallow) ? r.disallow : r.disallow ? [r.disallow] : []
    );
    expect(disallowed).toContain("/api/");
  });

  it("allows public auth routes", async () => {
    const { default: robots } = await import("../../src/app/robots");
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const allowed = rules.flatMap((r) =>
      Array.isArray(r.allow) ? r.allow : r.allow ? [r.allow] : []
    );
    expect(allowed).toContain("/");
    expect(allowed).toContain("/auth/login");
  });

  it("includes sitemap URL", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    const { default: robots } = await import("../../src/app/robots");
    const result = robots();
    expect(result.sitemap).toBe("https://example.com/sitemap.xml");
  });

  it("uses localhost fallback when NEXT_PUBLIC_APP_URL is unset", async () => {
    const { default: robots } = await import("../../src/app/robots");
    const result = robots();
    expect(result.sitemap).toContain("localhost:3000");
  });
});

describe("sitemap.ts", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("only contains public routes", async () => {
    const { default: sitemap } = await import("../../src/app/sitemap");
    const result = sitemap();
    const urls = result.map((entry) => entry.url);
    // Must not contain any authenticated routes
    expect(urls.every((url) => !url.includes("/dashboard"))).toBe(true);
    expect(urls.every((url) => !url.includes("/api"))).toBe(true);
  });

  it("root URL has highest priority", async () => {
    const { default: sitemap } = await import("../../src/app/sitemap");
    const result = sitemap();
    const root = result.find((e) => {
      try {
        return new URL(e.url).pathname === "/";
      } catch {
        return false;
      }
    });
    expect(root).toBeDefined();
    expect(root?.priority).toBe(1);
  });

  it("contains login and register pages", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    const { default: sitemap } = await import("../../src/app/sitemap");
    const result = sitemap();
    const urls = result.map((e) => e.url);
    expect(urls.some((url) => url.includes("/auth/login"))).toBe(true);
    expect(urls.some((url) => url.includes("/auth/register"))).toBe(true);
  });

  it("all entries have lastModified as Date", async () => {
    const { default: sitemap } = await import("../../src/app/sitemap");
    const result = sitemap();
    result.forEach((entry) => {
      expect(entry.lastModified).toBeInstanceOf(Date);
    });
  });

  it("uses NEXT_PUBLIC_APP_URL as base URL when set", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://myjobtracker.app";
    const { default: sitemap } = await import("../../src/app/sitemap");
    const result = sitemap();
    expect(result[0].url).toBe("https://myjobtracker.app");
  });
});
