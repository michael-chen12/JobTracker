import { Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { FadeIn } from './FadeIn';

export function HighlightCard() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 overflow-hidden relative">
            {/* Decorative circle */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

            <CardContent className="p-8 sm:p-12 relative z-10 text-center">
              <Quote className="h-10 w-10 mx-auto mb-6 text-white/60" />
              <p className="text-xl sm:text-2xl font-medium leading-relaxed text-white/90">
                Stop juggling spreadsheets and email threads. Bring your entire
                job search into one intelligent workspace.
              </p>
              <p className="mt-6 text-sm text-white/60">
                Built by job seekers, for job seekers
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </section>
  );
}
