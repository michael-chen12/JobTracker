import Link from 'next/link';
import { Briefcase } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold">JobTracker</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with Next.js, Supabase &amp; Claude AI
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} JobTracker. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
