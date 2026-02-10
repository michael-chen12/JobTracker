"use client";

import { useEffect } from "react";

// Root-level error boundary — captures errors in the root layout.
// Vercel Error Monitoring ingests console.error calls from client-side errors
// and surfaces them in the Vercel dashboard under the "Errors" tab.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error.message, error.digest ?? "");
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center space-y-4 max-w-sm">
            <div className="text-4xl">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900">
              Something went wrong
            </h1>
            <p className="text-gray-600 text-sm">
              An unexpected error occurred. Our team has been notified.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
