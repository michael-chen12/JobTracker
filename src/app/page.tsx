import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { HighlightCard } from '@/components/landing/HighlightCard';
import { CTASection } from '@/components/landing/CTASection';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function Home() {
  return (
    <div className="min-h-screen scroll-smooth">
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <StatsSection />
        <HighlightCard />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
