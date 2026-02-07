'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { requestDataExport } from '@/actions/gdpr';
import type { ExportType } from '@/types/application';

export function ExportDataSection() {
  const { toast } = useToast();
  const [exportType, setExportType] = useState<ExportType>('json');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const result = await requestDataExport({ export_type: exportType });

      if (result.success) {
        // Trigger download
        window.open(result.data.signedUrl, '_blank');
        toast({
          title: 'Export ready',
          description: `Your ${result.data.exportType.toUpperCase()} export has been downloaded. The link expires in 1 hour.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Export failed',
          description: result.error,
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setExportType('json')}
          disabled={isExporting}
          className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors text-left ${
            exportType === 'json'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          } ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <FileJson
            className={`h-8 w-8 flex-shrink-0 ${
              exportType === 'json'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Complete Data (JSON)
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              All data with nested structure
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setExportType('csv')}
          disabled={isExporting}
          className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors text-left ${
            exportType === 'csv'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          } ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <FileSpreadsheet
            className={`h-8 w-8 flex-shrink-0 ${
              exportType === 'csv'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Applications Table (CSV)
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Flattened spreadsheet format
            </p>
          </div>
        </button>
      </div>

      <Button onClick={handleExport} disabled={isExporting} className="w-full sm:w-auto">
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </>
        )}
      </Button>
    </div>
  );
}
