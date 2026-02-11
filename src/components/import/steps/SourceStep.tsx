"use client";

import { Linkedin, Briefcase, Building2, FileSpreadsheet } from "lucide-react";
import type { ImportSource } from "@/types/application";

interface SourceStepProps {
  onSelect: (source: ImportSource) => void;
}

const SOURCES: { id: ImportSource; label: string; description: string; icon: React.ElementType }[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    description:
      "Import from LinkedIn's data export. Go to Settings → Data Privacy → Get a copy of your data, then upload the CSV.",
    icon: Linkedin,
  },
  {
    id: "indeed",
    label: "Indeed",
    description:
      "Import from Indeed's data export. Go to Account Settings → Privacy → Download My Data, then upload the CSV.",
    icon: Briefcase,
  },
  {
    id: "greenhouse",
    label: "Greenhouse ATS",
    description:
      "Import via the Greenhouse Harvest API using your API key. Suited for recruiters and hiring managers.",
    icon: Building2,
  },
  {
    id: "generic_csv",
    label: "Generic CSV",
    description:
      "Upload any CSV file and map the columns to application fields. Works with any platform that exports data.",
    icon: FileSpreadsheet,
  },
];

export function SourceStep({ onSelect }: SourceStepProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Choose where you want to import your applications from.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SOURCES.map((src) => {
          const Icon = src.icon;
          return (
            <button
              key={src.id}
              onClick={() => onSelect(src.id)}
              className="
                flex flex-col gap-2 p-4 rounded-lg border text-left
                bg-white dark:bg-gray-900
                border-gray-200 dark:border-gray-700
                hover:border-gray-400 dark:hover:border-gray-500
                hover:bg-gray-50 dark:hover:bg-gray-800
                transition-colors active:scale-[0.98]
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400
                min-h-[44px]
              "
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {src.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {src.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
