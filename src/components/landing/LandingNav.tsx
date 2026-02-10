import Link from 'next/link';

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
          <Link
            href="/auth/login"
            className="hidden sm:inline-flex items-center rounded-md h-9 px-4 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center rounded-md bg-foreground text-background h-9 px-4 text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
