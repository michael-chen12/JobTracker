import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-lg">JobTracker</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button
            size="sm"
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Link href="/auth/login">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
