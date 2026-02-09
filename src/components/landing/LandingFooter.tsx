import Link from "next/link";
import { Briefcase } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Built with Next.js, Supabase &amp; Claude AI
          </p>
        </div>
      </div>
    </footer>
  );
}
