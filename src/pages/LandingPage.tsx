import { useAppData } from '../context/AppDataContext';
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowUp, House, LogIn } from 'lucide-react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Reveal } from '../components/marketing/Reveal';
import { StayPlanner } from '../components/marketing/StayPlanner';
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
import { scrollToSection } from '../hooks/useBookingAction';

export function LandingPage() {
  const { data } = useAppData();
  const sections = data.settings.website.sections;
  const { user } = useAuth();
  const compactGuest = !user || user.role === 'user';
  const location = useLocation();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const target = (location.state as { scrollToSection?: string } | null)?.scrollToSection;
    if (!target) return;
    const timer = window.setTimeout(() => scrollToSection(target), 80);
    return () => window.clearTimeout(timer);
  }, [location.state]);

  return <div className={`marketing-page min-h-screen bg-[var(--page)] ${compactGuest ? 'guest-mobile-compact' : ''}`}>
    <motion.div aria-hidden="true" style={{ scaleX: progress }} className="fixed inset-x-0 top-0 z-[80] h-1 origin-left bg-champagne" />
    <MarketingNav />
    <main>
      <HeroSection />
      <div className="hotel-ticker" aria-label="Mehmonxona qulayliklari">
        <div className="hotel-ticker-track" aria-hidden="true">{[0, 1, 2, 3].map((item) => <span key={item}>{data.settings.hotelName.toUpperCase()} <i>✦</i> TOSHKENT <i>✦</i> QULAYLIK VA NAFOSAT <i>✦</i> UNUTILMAS HORDIQ <i>✦</i></span>)}</div>
      </div>
      {sections.stats && <Reveal><StatsStrip /></Reveal>}
      {sections.rooms && <Reveal><RoomsShowcase compactGuest={compactGuest} /></Reveal>}
      {sections.about && <Reveal><ExperienceSection /></Reveal>}
      {sections.gallery && <Reveal><GallerySection compactGuest={compactGuest} /></Reveal>}
      {sections.reviews && <Reveal><ReviewsSection compactGuest={compactGuest} /></Reveal>}
      {sections.contact && <Reveal><LocationSection /></Reveal>}
      {sections.planner && <Reveal><StayPlanner /></Reveal>}
      {sections.cta && <Reveal><CtaBand /></Reveal>}
    </main>
    <SiteFooter />
    <nav aria-label="Tezkor safar amallari" className="hotel-quick-dock">
      {user
        ? <Link to="/app" aria-label="Kabinetga qaytish" className="hotel-dock-account"><House size={17} /><span className="dock-wide-label">Kabinetga qaytish</span><span className="dock-short-label">Kabinet</span></Link>
        : <Link to="/login" state={{ from: '/app', reason: 'account' }} className="hotel-dock-account"><LogIn size={17} /><span className="dock-wide-label">Tizimga kirish</span><span className="dock-short-label">Kirish</span></Link>}
      <button className="dock-top-button" type="button" aria-label="Sahifa boshiga" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><ArrowUp size={18} /></button>
    </nav>
  </div>;
}
