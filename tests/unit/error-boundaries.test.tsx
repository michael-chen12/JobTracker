import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Mock lucide-react to avoid ESM issues in test environment
vi.mock("lucide-react", () => ({
  AlertCircle: ({ className }: { className?: string }) =>
    React.createElement("svg", { "data-testid": "alert-circle", className }),
}));

// Mock shadcn Button
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
  }) =>
    React.createElement(
      "button",
      { onClick, "data-variant": variant },
      children
    ),
}));

describe("DashboardError", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.resetModules();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("renders error message heading", async () => {
    const { default: DashboardError } = await import(
      "../../src/app/dashboard/error"
    );
    const error = new Error("test dashboard error");
    const reset = vi.fn();

    render(React.createElement(DashboardError, { error, reset }));
    expect(screen.getByText("Something went wrong")).toBeDefined();
  });

  it("renders reload button", async () => {
    const { default: DashboardError } = await import(
      "../../src/app/dashboard/error"
    );
    const error = new Error("test error");
    const reset = vi.fn();

    render(React.createElement(DashboardError, { error, reset }));
    expect(screen.getByText("Reload page")).toBeDefined();
  });

  it("calls reset() when reload button is clicked", async () => {
    const { default: DashboardError } = await import(
      "../../src/app/dashboard/error"
    );
    const error = new Error("click test");
    const reset = vi.fn();

    render(React.createElement(DashboardError, { error, reset }));
    const button = screen.getByText("Reload page");
    fireEvent.click(button);
    expect(reset).toHaveBeenCalledOnce();
  });

  it("calls console.error with [dashboard-error] tag", async () => {
    const { default: DashboardError } = await import(
      "../../src/app/dashboard/error"
    );
    const error = new Error("console test");
    const reset = vi.fn();

    render(React.createElement(DashboardError, { error, reset }));
    // useEffect fires synchronously in test environment with React 18+
    expect(consoleSpy).toHaveBeenCalledWith(
      "[dashboard-error]",
      "console test",
      ""
    );
  });

  it("renders alert icon", async () => {
    const { default: DashboardError } = await import(
      "../../src/app/dashboard/error"
    );
    const error = new Error("icon test");
    const reset = vi.fn();

    render(React.createElement(DashboardError, { error, reset }));
    expect(screen.getByTestId("alert-circle")).toBeDefined();
  });
});

describe("GlobalError", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.resetModules();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("renders error heading", async () => {
    const { default: GlobalError } = await import(
      "../../src/app/global-error"
    );
    const error = new Error("global test");
    const reset = vi.fn();

    render(React.createElement(GlobalError, { error, reset }));
    expect(screen.getByText("Something went wrong")).toBeDefined();
  });

  it("renders try again button", async () => {
    const { default: GlobalError } = await import(
      "../../src/app/global-error"
    );
    const error = new Error("button test");
    const reset = vi.fn();

    render(React.createElement(GlobalError, { error, reset }));
    expect(screen.getByText("Try again")).toBeDefined();
  });

  it("calls reset() when try again is clicked", async () => {
    const { default: GlobalError } = await import(
      "../../src/app/global-error"
    );
    const error = new Error("reset test");
    const reset = vi.fn();

    render(React.createElement(GlobalError, { error, reset }));
    const button = screen.getByText("Try again");
    fireEvent.click(button);
    expect(reset).toHaveBeenCalledOnce();
  });

  it("calls console.error with [global-error] tag", async () => {
    const { default: GlobalError } = await import(
      "../../src/app/global-error"
    );
    const error = new Error("log test");
    const reset = vi.fn();

    render(React.createElement(GlobalError, { error, reset }));
    expect(consoleSpy).toHaveBeenCalledWith("[global-error]", "log test", "");
  });
});
