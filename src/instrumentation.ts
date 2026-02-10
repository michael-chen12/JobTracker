import { type Instrumentation } from "next";

// Called once when the Next.js server starts.
// Use this to initialize observability tools (OpenTelemetry, Sentry, etc.).
export function register() {
  // No-op: error tracking is handled by Vercel's built-in monitoring.
  // To add Sentry, import and initialize here with NEXT_RUNTIME guards.
}

// Called for every unhandled server-side error.
// Vercel captures these automatically via Function Logs when console.error is used.
export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context
) => {
  if (process.env.NODE_ENV === "production") {
    console.error("[server-error]", {
      message: (error as Error).message,
      digest: (error as Error & { digest?: string }).digest,
      method: request.method,
      path: request.path,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    });
  }
};
