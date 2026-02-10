import { FadeIn } from './FadeIn';

const steps = [
  {
    number: 1,
    title: 'Create Your Account',
    description:
      'Sign up free in seconds with Google, GitHub, or email. No credit card required.',
  },
  {
    number: 2,
    title: 'Add Your Applications',
    description:
      'Track every job with status updates, notes, documents, and contact details.',
  },
  {
    number: 3,
    title: 'Let AI Help You',
    description:
      'Get smart follow-up reminders, resume match scores, and application insights.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        <FadeIn>
          <div className="text-center max-w-lg mx-auto mb-14 sm:mb-20">
            <p className="text-sm font-medium text-muted-foreground tracking-[0.06em] uppercase mb-3">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.025em] leading-tight text-foreground">
              Up and running in minutes
            </h2>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden sm:block absolute top-5 left-[22%] right-[22%] h-px bg-border" />

          {steps.map((step, index) => (
            <FadeIn key={step.number} delay={index * 120}>
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="relative z-10 w-10 h-10 rounded-full border-2 border-border flex items-center justify-center text-sm font-semibold text-muted-foreground mb-5">
                  {step.number}
                </div>
                <h3 className="text-base font-semibold tracking-[-0.01em] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
