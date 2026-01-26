'use client';

import { ApplicationDocument } from '@/types/application';
import { FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentsSectionProps {
  applicationId: string;
  documents: ApplicationDocument[];
}

/**
 * DocumentsSection - Placeholder for document management
 * TODO: Implement in Ticket #24
 */
export function DocumentsSection({ applicationId, documents }: DocumentsSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Documents
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({documents.length})
            </span>
          </div>
          <Button size="sm" variant="outline" disabled>
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </div>

        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Document upload coming soon</p>
          <p className="text-sm">(Ticket #24)</p>
        </div>
      </div>
    </div>
  );
}
