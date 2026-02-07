import Link from 'next/link';
import { ArrowRight, ChevronDown, Sparkles, ClipboardList, Brain, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from './FadeIn';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-32 sm:pb-24 text-center">
        <FadeIn>
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            AI-Powered Job Search Companion
          </Badge>
        </FadeIn>

        <FadeIn delay={100}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            Land Your{' '}
            <span className="text-blue-600 dark:text-blue-400">Dream Job</span>,
            One Application at a Time
          </h1>
        </FadeIn>

        <FadeIn delay={200}>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Organize, track, and optimize your job search with AI-powered
            insights. Never miss a follow-up or lose track of where you
            applied again.
          </p>
        </FadeIn>

        <FadeIn delay={300}>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
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
              <Link href="#features">
                See How It Works
                <ChevronDown className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </FadeIn>

        <FadeIn delay={400}>
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-muted-foreground">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-foreground">Smart</span>
              <span>Tracking</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-border" />
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-foreground">AI</span>
              <span>Insights</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-border" />
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-foreground">100%</span>
              <span>Private</span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
