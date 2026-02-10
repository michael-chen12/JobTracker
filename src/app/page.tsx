import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HighlightCard } from "@/components/landing/HighlightCard";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Home() {
  return (
    <div className="min-h-screen scroll-smooth">
      <LandingNav />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HighlightCard />
      </main>
      <LandingFooter />
    </div>
  );
}
