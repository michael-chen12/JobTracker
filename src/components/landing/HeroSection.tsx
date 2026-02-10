import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "./FadeIn";

const mockApplications = [
  {
    initials: "ST",
    company: "Stripe",
    role: "Frontend Engineer",
    status: "Interview",
    date: "Today",
    statusClass: "bg-foreground/8 text-foreground",
  },
  {
    initials: "FG",
    company: "Figma",
    role: "Product Designer",
    status: "Applied",
    date: "2d ago",
    statusClass: "bg-muted text-muted-foreground",
  },
  {
    initials: "SH",
    company: "Shopify",
    role: "Full Stack Dev",
    status: "Offer",
    date: "3d ago",
    statusClass: "bg-foreground text-primary-foreground",
  },
  {
    initials: "VR",
    company: "Vercel",
    role: "DX Engineer",
    status: "Screening",
    date: "1w ago",
    statusClass: "bg-secondary text-secondary-foreground",
  },
];

const aiNote = "Claude suggests following up with the Stripe recruiter by Thursday — it's been 5 days since your last touchpoint.";

function AppMockup() {
  return (
    <div className="relative w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto">
      {/* Mock app window */}
      <div className="rounded-2xl border border-border bg-card shadow-warm-md overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/60 bg-background/50">
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
          <span className="ml-3 text-[11px] font-medium text-muted-foreground/60 tracking-wide">
            Applications · 4 active
          </span>
        </div>

        {/* Application rows */}
        <div className="divide-y divide-border/50">
          {mockApplications.map((app) => (
            <div
              key={app.company}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-default"
            >
              {/* Company initial */}
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {app.initials}
                </span>
              </div>

              {/* Role + company */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate leading-tight">
                  {app.role}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {app.company}
                </p>
              </div>

              {/* Status + date */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${app.statusClass}`}
                >
                  {app.status}
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  {app.date}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* AI note at the bottom */}
        <div className="px-4 py-3 border-t border-border/60 bg-muted/20">
          <p className="text-[11px] text-muted-foreground leading-snug">
            <span className="font-semibold text-foreground">AI · </span>
            {aiNote}
          </p>
        </div>
      </div>

      {/* Floating badge — achieves depth without decoration */}
      <div className="absolute -top-3 -right-3 bg-card border border-border rounded-xl px-3 py-1.5 shadow-warm-sm hidden sm:flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-foreground/60" />
        <span className="text-[11px] font-medium text-muted-foreground">
          Match score · 94%
        </span>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-16 pb-16 sm:pt-24 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: copy */}
          <FadeIn>
            <div className="max-w-lg">
              <p className="text-sm font-medium text-muted-foreground tracking-[0.06em] uppercase mb-5">
                Job Application Tracker
              </p>
              <h1 className="text-5xl sm:text-6xl font-bold tracking-[-0.04em] leading-[1.05] text-foreground text-balance">
                The job search
                <br />
                grind, tamed.
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
                One place for every application, every follow-up, every recruiter
                conversation. With AI that actually knows your pipeline.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 items-start">
                <Button size="lg" asChild>
                  <Link href="/auth/login">
                    Start tracking free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="lg" asChild className="text-muted-foreground">
                  <Link href="#features">See how it works</Link>
                </Button>
              </div>

              <p className="mt-5 text-xs text-muted-foreground/60">
                Free forever · No credit card · GDPR compliant
              </p>
            </div>
          </FadeIn>

          {/* Right: live mock preview */}
          <FadeIn delay={150}>
            <AppMockup />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
