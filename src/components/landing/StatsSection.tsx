'use client';

// Scrolling marquee of job titles + company names — shows the product in context
// Uses pure CSS animation, no external library

const roles = [
  "Frontend Engineer",
  "Product Designer",
  "Software Engineer",
  "Data Scientist",
  "UX Researcher",
  "Backend Developer",
  "DevOps Engineer",
  "Product Manager",
  "ML Engineer",
  "Full Stack Dev",
  "iOS Developer",
  "Systems Engineer",
  "Technical Recruiter",
  "Engineering Manager",
  "Solutions Architect",
];

// Duplicate to create seamless loop
const doubled = [...roles, ...roles];

export function StatsSection() {
  return (
    <section className="py-14 border-y border-border/50 overflow-hidden">
      <div className="mb-6 text-center">
        <p className="text-xs font-medium text-muted-foreground/50 tracking-[0.12em] uppercase">
          Works for people applying to roles like
        </p>
      </div>

      {/* Marquee container — masks overflow on both sides */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div
          className="flex gap-3 w-max"
          style={{
            animation: "marquee 32s linear infinite",
          }}
        >
          {doubled.map((role, i) => (
            <span
              key={i}
              className="flex-shrink-0 text-sm font-medium text-muted-foreground px-4 py-2 rounded-full border border-border/60 bg-card whitespace-nowrap"
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
