import { useEffect, useRef, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

/** Animate individual content as it enters view, rather than a whole tall section. */
export function Reveal({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const items = Array.from(root.current?.querySelectorAll<HTMLElement>('h2, h3, figure, section img, #gallery button, #about [data-amenity-card], #stay-planner > div, [data-reveal-item]') ?? []);
    if (reduced) { items.forEach((item) => item.removeAttribute('data-scroll-reveal')); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { (entry.target as HTMLElement).dataset.scrollReveal = 'visible'; observer.unobserve(entry.target); } });
    }, { threshold: .12 });
    items.forEach((item, index) => { item.dataset.scrollReveal = 'pending'; item.style.setProperty('--reveal-delay', `${index % 3 * 75}ms`); observer.observe(item); });
    return () => { observer.disconnect(); items.forEach((item) => item.removeAttribute('data-scroll-reveal')); };
  }, [reduced]);
  return <div ref={root}>{children}</div>;
}
