import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FadeIn } from './FadeIn';

export function CTASection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to Take Control of Your Job Search?
          </h2>
          <p className="text-muted-foreground text-lg mt-4">
            Join today and start tracking smarter, not harder.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-base"
            >
              <Link href="/auth/login">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-12 text-base px-8">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required. Free forever for individual use.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
