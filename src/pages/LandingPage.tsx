import { MarketingNav } from '../components/MarketingNav';
import { HeroSection } from '../components/marketing/HeroSection';
import { StatsStrip } from '../components/marketing/StatsStrip';
import { RoomsShowcase } from '../components/marketing/RoomsShowcase';
import { ExperienceSection } from '../components/marketing/ExperienceSection';
import { GallerySection } from '../components/marketing/GallerySection';
import { ReviewsSection } from '../components/marketing/ReviewsSection';
import { LocationSection } from '../components/marketing/LocationSection';
import { CtaBand } from '../components/marketing/CtaBand';
import { SiteFooter } from '../components/marketing/SiteFooter';

export function LandingPage() {
  return <div className="min-h-screen bg-[var(--page)]">
    <MarketingNav overlay />
    <main>
      <HeroSection />
      <StatsStrip />
      <RoomsShowcase />
      <ExperienceSection />
      <GallerySection />
      <ReviewsSection />
      <LocationSection />
      <CtaBand />
    </main>
    <SiteFooter />
  </div>;
}
