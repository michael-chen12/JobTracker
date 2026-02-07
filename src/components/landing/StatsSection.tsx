import { FadeIn } from './FadeIn';

const stats = [
  { value: '6+', label: 'AI-Powered Features' },
  { value: '100%', label: 'Free to Use' },
  { value: 'GDPR', label: 'Compliant & Private' },
  { value: '4', label: 'Auth Providers' },
];

export function StatsSection() {
  return (
    <section className="py-16 sm:py-20 bg-muted/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
