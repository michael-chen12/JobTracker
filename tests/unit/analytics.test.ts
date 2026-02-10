import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Next.js to avoid ESM issues
vi.mock("next", () => ({
  default: {},
}));

describe("instrumentation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("register() runs without throwing", async () => {
    const { register } = await import("../../src/instrumentation");
    expect(() => register()).not.toThrow();
  });

  it("onRequestError logs to console.error in production", async () => {
    const original = process.env.NODE_ENV;
    // @ts-expect-error overriding for test
    process.env.NODE_ENV = "production";
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { onRequestError } = await import("../../src/instrumentation");

    onRequestError(
      new Error("test error"),
      { path: "/dashboard", method: "GET", headers: {} },
      {
        routerKind: "App Router",
        routePath: "/dashboard",
        routeType: "render",
        renderSource: "react-server-components",
        revalidateReason: undefined,
        renderType: "dynamic",
      }
    );

    expect(consoleSpy).toHaveBeenCalledOnce();
    expect(consoleSpy.mock.calls[0][0]).toBe("[server-error]");

    consoleSpy.mockRestore();
    // @ts-expect-error restoring
    process.env.NODE_ENV = original;
  });

  it("onRequestError is silent in development", async () => {
    const original = process.env.NODE_ENV;
    // @ts-expect-error overriding for test
    process.env.NODE_ENV = "development";
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { onRequestError } = await import("../../src/instrumentation");

    onRequestError(
      new Error("dev error"),
      { path: "/dashboard", method: "GET", headers: {} },
      {
        routerKind: "App Router",
        routePath: "/dashboard",
        routeType: "render",
        renderSource: "react-server-components",
        revalidateReason: undefined,
        renderType: "dynamic",
      }
    );

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
    // @ts-expect-error restoring
    process.env.NODE_ENV = original;
  });

  it("onRequestError includes error message and path in log payload", async () => {
    const original = process.env.NODE_ENV;
    // @ts-expect-error overriding for test
    process.env.NODE_ENV = "production";
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { onRequestError } = await import("../../src/instrumentation");

    const error = new Error("database timeout");
    onRequestError(
      error,
      { path: "/api/applications", method: "POST", headers: {} },
      {
        routerKind: "App Router",
        routePath: "/api/applications",
        routeType: "route",
        renderSource: "react-server-components",
        revalidateReason: undefined,
        renderType: "dynamic",
      }
    );

    const logPayload = consoleSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(logPayload.message).toBe("database timeout");
    expect(logPayload.path).toBe("/api/applications");
    expect(logPayload.method).toBe("POST");

    consoleSpy.mockRestore();
    // @ts-expect-error restoring
    process.env.NODE_ENV = original;
  });
});

describe("Vercel Analytics packages", () => {
  it("@vercel/analytics is installed", async () => {
    await expect(import("@vercel/analytics/react")).resolves.toBeDefined();
  });

  it("@vercel/speed-insights is installed", async () => {
    await expect(import("@vercel/speed-insights/next")).resolves.toBeDefined();
  });

  it("sharp is installed for image optimization", async () => {
    await expect(import("sharp")).resolves.toBeDefined();
  });
});
