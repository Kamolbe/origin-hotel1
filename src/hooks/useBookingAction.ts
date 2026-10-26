import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Smoothly brings a section of the current page into view. */
export function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) { window.location.hash = `#${id}`; return; }
  target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

/**
 * One entrance to the booking tools for every "Book / reserve" control.
 *
 * A signed-in visitor goes straight to the guest area. A visitor who is not
 * signed in is *not* thrown at the sign-in screen from the public pages —
 * they are taken to the room showcase on the page they are already reading;
 * signing in is only requested from the explicit booking step.
 */
export function useBookingAction() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return useCallback((state?: Record<string, unknown>) => {
    if (user) { navigate('/app/rooms', state ? { state } : undefined); return; }
    if (pathname === '/') { scrollToSection('rooms'); return; }
    navigate('/', { state: { scrollToSection: 'rooms' } });
  }, [user, navigate, pathname]);
}

/**
 * The deliberate, explained sign-in step: used only for an action that really
 * needs an account (completing a booking) and only from the booking button.
 */
export function useBookingGate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return useCallback((state?: Record<string, unknown>) => {
    if (user) { navigate('/app/rooms', state ? { state } : undefined); return; }
    navigate('/login', { state: { ...(state ?? {}), from: '/app/rooms', reason: 'booking' } });
  }, [user, navigate]);
}
