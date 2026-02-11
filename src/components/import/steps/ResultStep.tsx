"use client";

import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ImportLog } from "@/types/application";

interface ResultStepProps {
  importLog: ImportLog | null;
  error: string | null;
  onDone: () => void;
  onRetry: () => void;
}

const SOURCE_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  greenhouse: "Greenhouse ATS",
  generic_csv: "Generic CSV",
};

export function ResultStep({ importLog, error, onDone, onRetry }: ResultStepProps) {
  if (error || !importLog) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <XCircle className="h-12 w-12 text-red-500" />
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Import Failed</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {error ?? "An unexpected error occurred"}
          </p>
        </div>
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1" onClick={onRetry}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button className="flex-1" onClick={onDone}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  const sourceLabel = SOURCE_LABELS[importLog.source] ?? importLog.source;

  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <CheckCircle2 className="h-12 w-12 text-green-500" />

      <div>
        <p className="font-semibold text-gray-900 dark:text-white">
          Import Complete
        </p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Successfully imported from {sourceLabel}
        </p>
      </div>

      {/* Stats */}
      <div className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 p-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {importLog.imported_count}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Imported</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {importLog.skipped_count}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Skipped</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {importLog.failed_count}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Failed</p>
        </div>
      </div>

      {importLog.skipped_count > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {importLog.skipped_count} duplicate
          {importLog.skipped_count !== 1 ? "s were" : " was"} skipped because
          {importLog.skipped_count !== 1 ? " they are" : " it is"} already in
          your tracker.
        </p>
      )}

      <Button className="w-full" onClick={onDone}>
        {importLog.imported_count > 0 ? "View Applications" : "Close"}
      </Button>
    </div>
  );
}
