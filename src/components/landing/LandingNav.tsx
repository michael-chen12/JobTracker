import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <span className="font-semibold text-base tracking-[-0.02em] text-foreground">
            JobTracker
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
          >
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth/login">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
