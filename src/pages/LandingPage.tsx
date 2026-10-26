import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useContactDialog } from '../context/ContactDialogContext';
import { ArrowUp, BedDouble, Calculator, House, LogIn, Phone } from 'lucide-react';
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
  const { user } = useAuth();
  const { openContact } = useContactDialog();
  const location = useLocation();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const target = (location.state as { scrollToSection?: string } | null)?.scrollToSection;
    if (!target) return;
    const timer = window.setTimeout(() => scrollToSection(target), 80);
    return () => window.clearTimeout(timer);
  }, [location.state]);

  return <div className="marketing-page min-h-screen bg-[var(--page)]">
    <motion.div aria-hidden="true" style={{ scaleX: progress }} className="fixed inset-x-0 top-0 z-[80] h-1 origin-left bg-champagne" />
    <MarketingNav />
    <main>
      <HeroSection />
      <div className="hotel-ticker" aria-label="Mehmonxona qulayliklari">
        <div className="hotel-ticker-track" aria-hidden="true">{[0, 1, 2, 3].map((item) => <span key={item}>ORIGIN HOTEL <i>✦</i> TOSHKENT <i>✦</i> QULAYLIK VA NAFOSAT <i>✦</i> UNUTILMAS HORDIQ <i>✦</i></span>)}</div>
      </div>
      <Reveal><StatsStrip /></Reveal>
      <Reveal><RoomsShowcase /></Reveal>
      <Reveal><ExperienceSection /></Reveal>
      <Reveal><GallerySection /></Reveal>
      <Reveal><ReviewsSection /></Reveal>
      <Reveal><LocationSection /></Reveal>
      <Reveal><StayPlanner /></Reveal>
      <Reveal><CtaBand /></Reveal>
    </main>
    <SiteFooter />
    <nav aria-label="Tezkor safar amallari" className="hotel-quick-dock">
      {user
        ? <Link to="/app" className="hotel-dock-account"><House size={16} /><span>Kabinetga qaytish</span></Link>
        : <Link to="/login" state={{ from: '/app', reason: 'account' }} className="hotel-dock-account"><LogIn size={16} /><span>Tizimga kirish</span></Link>}
      <a href="#rooms" onClick={(event) => { event.preventDefault(); scrollToSection('rooms'); }}><BedDouble size={17} /><span>Xonalar</span></a>
      <a href="#stay-planner" onClick={(event) => { event.preventDefault(); scrollToSection('stay-planner'); }}><Calculator size={17} /><span>Narxni hisoblash</span></a>
      <button type="button" onClick={openContact}><Phone size={16} /><span>Aloqa</span></button>
      <button type="button" aria-label="Sahifa boshiga" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><ArrowUp size={18} /></button>
    </nav>
  </div>;
}
