"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GenericFieldMapping } from "@/lib/import/csv-parser";

interface FieldMapperTableProps {
  headers: string[];
  mapping: Partial<GenericFieldMapping>;
  onChange: (mapping: Partial<GenericFieldMapping>) => void;
}

const TARGET_FIELDS: {
  key: keyof GenericFieldMapping;
  label: string;
  required: boolean;
}[] = [
  { key: "company", label: "Company Name", required: true },
  { key: "position", label: "Job Title / Position", required: true },
  { key: "applied_date", label: "Date Applied", required: false },
  { key: "job_url", label: "Job URL", required: false },
];

export function FieldMapperTable({
  headers,
  mapping,
  onChange,
}: FieldMapperTableProps) {
  function handleChange(key: keyof GenericFieldMapping, value: string) {
    onChange({
      ...mapping,
      [key]: value === "__none__" ? undefined : value,
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Map your CSV columns to application fields. Company and Position are
        required.
      </p>

      <div className="space-y-3">
        {TARGET_FIELDS.map((field) => (
          <div key={field.key} className="grid grid-cols-2 items-center gap-3">
            <Label className="text-sm font-medium">
              {field.label}
              {field.required && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </Label>

            <Select
              value={mapping[field.key] ?? "__none__"}
              onValueChange={(v) => handleChange(field.key, v)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select column…" />
              </SelectTrigger>
              <SelectContent>
                {!field.required && (
                  <SelectItem value="__none__" className="text-xs text-gray-400">
                    (Skip)
                  </SelectItem>
                )}
                {headers.map((h) => (
                  <SelectItem key={h} value={h} className="text-xs">
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
