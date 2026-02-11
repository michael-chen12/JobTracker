"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ImportCandidate } from "@/types/application";

interface ConfirmStepProps {
  toInsert: ImportCandidate[];
  skippedCount: number;
  source: string;
  isLoading: boolean;
  error: string | null;
  onConfirm: () => void;
}

export function ConfirmStep({
  toInsert,
  skippedCount,
  source,
  isLoading,
  error,
  onConfirm,
}: ConfirmStepProps) {
  const importCount = toInsert.length;
  const total = importCount + skippedCount;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          <span className="text-gray-900 dark:text-white">
            <strong>{importCount}</strong> application
            {importCount !== 1 ? "s" : ""} will be imported from {source}
          </span>
        </div>
        {skippedCount > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
            <span className="text-gray-600 dark:text-gray-400">
              <strong>{skippedCount}</strong> duplicate
              {skippedCount !== 1 ? "s" : ""} will be skipped (already in your
              tracker)
            </span>
          </div>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {total} total rows found
        </p>
      </div>

      {/* Preview of rows to import */}
      {importCount > 0 && (
        <ScrollArea className="max-h-40 rounded border border-gray-200 dark:border-gray-700">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                  Company
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                  Position
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {toInsert.slice(0, 20).map((row, i) => (
                <tr key={i}>
                  <td className="px-3 py-1.5 text-gray-900 dark:text-gray-100 max-w-[140px] truncate">
                    {row.company}
                  </td>
                  <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400 max-w-[160px] truncate">
                    {row.position}
                  </td>
                </tr>
              ))}
              {importCount > 20 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-3 py-2 text-center text-gray-400 text-xs"
                  >
                    …and {importCount - 20} more
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      )}

      {importCount === 0 && (
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">
          All {skippedCount} rows are already in your tracker.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <Button
        className="w-full"
        disabled={isLoading}
        onClick={onConfirm}
        variant={importCount === 0 ? "outline" : "default"}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Importing…
          </>
        ) : importCount === 0 ? (
          "Close"
        ) : (
          `Import ${importCount} Application${importCount !== 1 ? "s" : ""}`
        )}
      </Button>
    </div>
  );
}
