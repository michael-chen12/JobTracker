"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FieldMapperTable } from "./FieldMapperTable";
import type { ImportCandidate, ImportSource } from "@/types/application";
import type { GenericFieldMapping } from "@/lib/import/csv-parser";

interface PreviewStepProps {
  source: ImportSource;
  candidates: ImportCandidate[];
  headers: string[];
  genericMapping: Partial<GenericFieldMapping>;
  onMappingChange: (m: Partial<GenericFieldMapping>) => void;
  totalCount: number;
  failedRowCount: number;
}

const SOURCE_LABELS: Record<ImportSource, string> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  greenhouse: "Greenhouse ATS",
  generic_csv: "Generic CSV",
};

const SOURCE_BADGE_VARIANTS: Record<
  ImportSource,
  "default" | "secondary" | "outline"
> = {
  linkedin: "default",
  indeed: "secondary",
  greenhouse: "outline",
  generic_csv: "secondary",
};

export function PreviewStep({
  source,
  candidates,
  headers,
  genericMapping,
  onMappingChange,
  totalCount,
  failedRowCount,
}: PreviewStepProps) {
  const previewRows = candidates.slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Format badge + counts */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={SOURCE_BADGE_VARIANTS[source]}>
          {SOURCE_LABELS[source]}
        </Badge>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {totalCount} row{totalCount !== 1 ? "s" : ""} found
          {failedRowCount > 0 && (
            <span className="text-orange-500 ml-1">
              · {failedRowCount} missing required fields (will be skipped)
            </span>
          )}
        </span>
      </div>

      {/* Generic CSV field mapper */}
      {source === "generic_csv" && (
        <FieldMapperTable
          headers={headers}
          mapping={genericMapping}
          onChange={onMappingChange}
        />
      )}

      {/* Preview table */}
      {previewRows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Preview (first {previewRows.length} of {totalCount})
          </p>
          <ScrollArea className="max-h-48 rounded border border-gray-200 dark:border-gray-700">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                    Company
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                    Position
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {previewRows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100 max-w-[120px] truncate">
                      {row.company}
                    </td>
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100 max-w-[140px] truncate">
                      {row.position}
                    </td>
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                      {row.applied_date ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      )}

      {previewRows.length === 0 && source === "generic_csv" && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          Map the required fields above to see a preview.
        </p>
      )}
    </div>
  );
}
