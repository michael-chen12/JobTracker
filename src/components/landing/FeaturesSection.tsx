import { Brain, ClipboardList, FileText, Users, Shield, KeyRound } from 'lucide-react';
import { FadeIn } from './FadeIn';

// Bento grid: asymmetric layout instead of 6 equal cards
export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <FadeIn>
          <div className="max-w-xl mb-12 sm:mb-16">
            <p className="text-sm font-medium text-muted-foreground tracking-[0.06em] uppercase mb-3">
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.025em] leading-tight text-foreground">
              Here&apos;s what
              <br />
              it does
            </h2>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Large AI card — spans 2 columns */}
          <FadeIn delay={0} className="sm:col-span-2">
            <div className="rounded-2xl border border-border/60 bg-card p-7 h-full shadow-warm-sm hover:shadow-warm transition-shadow duration-300">
              <Brain className="h-5 w-5 text-muted-foreground mb-5" />
              <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">
                AI follow-up suggestions (honestly pretty cool)
              </h3>
              <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed max-w-sm">
                I connected Claude AI to it. You give it your applications and it tells you when and how to follow up. Way better than trying to remember yourself.
              </p>

              {/* Fake AI response card */}
              <div className="mt-6 rounded-xl border border-border/70 bg-background p-4 space-y-2">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  AI suggestion
                </p>
                <p className="text-[13px] text-foreground leading-snug">
                  &ldquo;You applied to Figma 8 days ago and haven&apos;t heard back. Might be worth sending a short follow-up to the recruiter.&rdquo;
                </p>
                <div className="flex gap-2 pt-1">
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                    Draft email
                  </span>
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                    Snooze 2 days
                  </span>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Small card: Tracking */}
          <FadeIn delay={80}>
            <div className="rounded-2xl border border-border/60 bg-card p-7 h-full shadow-warm-sm hover:shadow-warm transition-shadow duration-300">
              <ClipboardList className="h-5 w-5 text-muted-foreground mb-5" />
              <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">
                See all your applications
              </h3>
              <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
                Table, kanban, or list view — pick what you like. Filter by status, salary, location. Basically everything I wished my spreadsheet could do.
              </p>
            </div>
          </FadeIn>

          {/* Small card: Documents */}
          <FadeIn delay={120}>
            <div className="rounded-2xl border border-border/60 bg-card p-7 h-full shadow-warm-sm hover:shadow-warm transition-shadow duration-300">
              <FileText className="h-5 w-5 text-muted-foreground mb-5" />
              <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">
                Keep your resume versions straight
              </h3>
              <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
                Attach your resume, cover letter, and offer letters to each application. I always used to mix up which resume I sent to who.
              </p>
            </div>
          </FadeIn>

          {/* Small card: Contacts */}
          <FadeIn delay={160}>
            <div className="rounded-2xl border border-border/60 bg-card p-7 h-full shadow-warm-sm hover:shadow-warm transition-shadow duration-300">
              <Users className="h-5 w-5 text-muted-foreground mb-5" />
              <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">
                Remember who you talked to
              </h3>
              <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
                Save recruiter names and notes per application. Useful for not embarrassing yourself in follow-up emails.
              </p>
            </div>
          </FadeIn>

          {/* Wide card: Privacy spans 1 or 2 col depending on grid */}
          <FadeIn delay={200}>
            <div className="rounded-2xl border border-border/60 bg-card p-7 h-full shadow-warm-sm hover:shadow-warm transition-shadow duration-300">
              <Shield className="h-5 w-5 text-muted-foreground mb-5" />
              <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">
                Your data stays yours
              </h3>
              <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
                Export everything as JSON or CSV whenever you want. You can also delete your account. I made it GDPR compliant.
              </p>
            </div>
          </FadeIn>

          {/* Auth card */}
          <FadeIn delay={240}>
            <div className="rounded-2xl border border-border/60 bg-card p-7 h-full shadow-warm-sm hover:shadow-warm transition-shadow duration-300">
              <KeyRound className="h-5 w-5 text-muted-foreground mb-5" />
              <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">
                A few ways to sign in
              </h3>
              <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
                Google, GitHub, LinkedIn, or email. Just use whatever you already have an account with.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
