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
    <section className="py-16 sm:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Get Started in Minutes
          </h2>
          <p className="text-muted-foreground text-lg mt-4">
            Three simple steps to a more organized job search.
          </p>
        </FadeIn>

        <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden sm:block absolute top-8 left-[20%] right-[20%] h-px bg-border" />

          {steps.map((step, index) => (
            <FadeIn key={step.number} delay={index * 150}>
              <div className="flex flex-col items-center text-center">
                <div className="relative z-10 w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mb-6">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
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
