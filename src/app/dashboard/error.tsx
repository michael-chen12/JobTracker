"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dashboard-scoped error boundary — preserves the layout header and nav.
// Catches errors thrown during rendering of any dashboard page.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard-error]", error.message, error.digest ?? "");
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Something went wrong
      </h2>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        An error occurred loading this page. Please try again.
      </p>
      <Button onClick={reset} variant="outline">
        Reload page
      </Button>
    </div>
  );
}
