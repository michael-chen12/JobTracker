import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FadeIn } from './FadeIn';

export function HighlightCard() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        <FadeIn>
          <div className="rounded-2xl bg-foreground px-8 sm:px-14 py-12 sm:py-16 relative overflow-hidden">
            {/* Subtle warm texture — no colored glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(30_8%_20%),_transparent_60%)] pointer-events-none" />

            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] leading-snug text-primary-foreground/90">
                Give it a try.{' '}
                <span className="text-primary-foreground/55">
                  I built this for myself during my own job search and it actually helped a lot. Maybe it&apos;ll help you too.
                </span>
              </p>
              <p className="mt-4 text-sm text-primary-foreground/40">
                Made by one developer who applied to way too many jobs
              </p>
              <div className="mt-8">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-foreground text-foreground hover:bg-primary-foreground/90 h-11 px-7 text-sm font-medium transition-colors"
                >
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
