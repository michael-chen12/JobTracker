'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { triggerResumeParsing } from '@/actions/parse-resume';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export function RetryParsingButton() {
  const [isRetrying, setIsRetrying] = useState(false);
  const router = useRouter();

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const result = await triggerResumeParsing();

      if (result.success) {
        // Refresh the page to show the new parsing status
        router.refresh();
      } else {
        alert(`Failed to retry parsing: ${result.error}`);
      }
    } catch (error) {
      console.error('Error retrying parsing:', error);
      alert('An unexpected error occurred while retrying');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Button
      onClick={handleRetry}
      disabled={isRetrying}
      size="sm"
      variant="outline"
      className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
      {isRetrying ? 'Retrying...' : 'Retry Parsing'}
    </Button>
  );
}
