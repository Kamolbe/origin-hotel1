import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';

type Theme = 'light' | 'dark';
type Origin = { x: number; y: number };
type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme, origin?: Origin) => void; toggleTheme: (event?: MouseEvent<HTMLElement>) => void };
type ThemeTransition = { ready: Promise<void>; finished: Promise<void>; skipTransition: () => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = 'originhotel-theme';

function getInitialTheme(): Theme {
  try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; }
  catch { return 'light'; }
}
function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* Theme works without storage. */ }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const current = useRef(theme);
  const version = useRef(0);
  const transition = useRef<ThemeTransition | null>(null);
  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => () => { version.current++; transition.current?.skipTransition(); delete document.documentElement.dataset.themeTransition; }, []);

  const setTheme = useCallback((next: Theme, origin?: Origin) => {
    if (next === current.current) return;
    current.current = next;
    const id = ++version.current;
    transition.current?.skipTransition();
    const root = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || root.dataset.reduceMotion === 'true';
    const active = document.activeElement instanceof HTMLElement ? document.activeElement.getBoundingClientRect() : null;
    const x = Math.max(0, Math.min(window.innerWidth, origin?.x ?? (active?.width ? active.left + active.width / 2 : window.innerWidth / 2)));
    const y = Math.max(0, Math.min(window.innerHeight, origin?.y ?? (active?.height ? active.top + active.height / 2 : window.innerHeight / 3)));
    const radius = Math.ceil(Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)));
    const commit = () => { if (id !== version.current) return; applyTheme(next); flushSync(() => setThemeState(next)); };
    const start = (document as unknown as { startViewTransition?: (callback: () => void) => ThemeTransition }).startViewTransition;
    if (reduced || !start) {
      delete root.dataset.themeTransition;
      applyTheme(next); setThemeState(next);
      if (!reduced) root.animate?.([{ opacity: .84 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' });
      return;
    }
    root.dataset.themeTransition = 'ripple';
    try {
      const view = start.call(document, commit);
      transition.current = view;
      void view.ready.then(() => {
        if (id !== version.current) return;
        root.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${radius}px at ${x}px ${y}px)` }], { duration: 680, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both', pseudoElement: '::view-transition-new(root)' });
      }).catch(() => { if (id === version.current) { applyTheme(next); setThemeState(next); } });
      void view.finished.catch(() => {}).then(() => { if (id === version.current) { transition.current = null; delete root.dataset.themeTransition; } });
    } catch {
      delete root.dataset.themeTransition;
      applyTheme(next); setThemeState(next);
    }
  }, []);
  const toggleTheme = useCallback((event?: MouseEvent<HTMLElement>) => {
    const origin = event && (event.clientX || event.clientY) ? { x: event.clientX, y: event.clientY } : undefined;
    setTheme(current.current === 'light' ? 'dark' : 'light', origin);
  }, [setTheme]);
  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
