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
              Built around how
              <br />
              real job hunts work
            </h2>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Large AI card — spans 2 columns */}
          <FadeIn delay={0} className="sm:col-span-2">
            <div className="rounded-2xl border border-border/60 bg-card p-7 h-full shadow-warm-sm hover:shadow-warm transition-shadow duration-300">
              <Brain className="h-5 w-5 text-muted-foreground mb-5" />
              <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">
                Claude AI reads your pipeline
              </h3>
              <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed max-w-sm">
                Not generic tips. Claude knows which company you applied to, when, and what happened — and gives you specific, timed follow-up suggestions.
              </p>

              {/* Fake AI response card */}
              <div className="mt-6 rounded-xl border border-border/70 bg-background p-4 space-y-2">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  AI suggestion
                </p>
                <p className="text-[13px] text-foreground leading-snug">
                  &ldquo;Your application to Figma is 8 days old with no response. Based on their typical timeline, this is a good moment to send a brief check-in to your recruiter contact.&rdquo;
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
                Your pipeline, visible
              </h3>
              <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
                Table, kanban, or list. Filter by status, salary, or priority. See everything without opening a spreadsheet.
              </p>
            </div>
          </FadeIn>

          {/* Small card: Documents */}
          <FadeIn delay={120}>
            <div className="rounded-2xl border border-border/60 bg-card p-7 h-full shadow-warm-sm hover:shadow-warm transition-shadow duration-300">
              <FileText className="h-5 w-5 text-muted-foreground mb-5" />
              <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">
                Documents alongside
              </h3>
              <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
                Resume versions, cover letters, offer letters — attached directly to each application, never lost again.
              </p>
            </div>
          </FadeIn>

          {/* Small card: Contacts */}
          <FadeIn delay={160}>
            <div className="rounded-2xl border border-border/60 bg-card p-7 h-full shadow-warm-sm hover:shadow-warm transition-shadow duration-300">
              <Users className="h-5 w-5 text-muted-foreground mb-5" />
              <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">
                Contacts you can trust
              </h3>
              <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
                Know exactly who you spoke with, what was said, and when to reach out again.
              </p>
            </div>
          </FadeIn>

          {/* Wide card: Privacy spans 1 or 2 col depending on grid */}
          <FadeIn delay={200}>
            <div className="rounded-2xl border border-border/60 bg-card p-7 h-full shadow-warm-sm hover:shadow-warm transition-shadow duration-300">
              <Shield className="h-5 w-5 text-muted-foreground mb-5" />
              <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">
                Your data, your rules
              </h3>
              <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
                Export everything as JSON or CSV. Delete your account anytime. GDPR compliant by design.
              </p>
            </div>
          </FadeIn>

          {/* Auth card */}
          <FadeIn delay={240}>
            <div className="rounded-2xl border border-border/60 bg-card p-7 h-full shadow-warm-sm hover:shadow-warm transition-shadow duration-300">
              <KeyRound className="h-5 w-5 text-muted-foreground mb-5" />
              <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">
                Sign in your way
              </h3>
              <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
                Google, GitHub, LinkedIn, or email. Your choice — always secure.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
