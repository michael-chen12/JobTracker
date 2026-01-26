import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <FileQuestion className="h-24 w-24 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Application Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The application you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
