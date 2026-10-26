import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { makeId } from '../services/storage';
import type { Visit } from '../types';

const SESSION_FLAG = 'origin-hotel-visit-logged';
const MAX_VISITS = 300;

function detectDevice(width: number): Visit['device'] {
  if (width < 640) return 'Mobil';
  if (width < 1024) return 'Planshet';
  return 'Desktop';
}

function detectBrowser(agent: string): string {
  if (/Edg\//.test(agent)) return 'Edge';
  if (/OPR\//.test(agent)) return 'Opera';
  if (/YaBrowser/.test(agent)) return 'Yandex';
  if (/Chrome\//.test(agent)) return 'Chrome';
  if (/Firefox\//.test(agent)) return 'Firefox';
  if (/Safari\//.test(agent)) return 'Safari';
  return 'Boshqa';
}

/**
 * Records one visit per browser tab, so the administrator can see who is using
 * the public website (device, browser, signed-in account and the page entered).
 * The history stays in this browser, which the users page states plainly.
 */
export function useVisitLog() {
  const { updateData } = useAppData();
  const { user } = useAuth();
  const location = useLocation();
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_FLAG)) return;
      sessionStorage.setItem(SESSION_FLAG, new Date().toISOString());
    } catch {
      // Without session storage a visit is recorded on every page load; still useful.
    }
    const account = userRef.current;
    const agent = navigator.userAgent;
    const visit: Visit = {
      id: makeId('visit'),
      at: new Date().toISOString(),
      path: `${location.pathname}${location.hash}`,
      device: detectDevice(window.innerWidth),
      browser: detectBrowser(agent),
      userId: account?.id,
      userName: account?.name,
      userRole: account?.role,
    };
    updateData((current) => ({ ...current, visits: [visit, ...current.visits].slice(0, MAX_VISITS) }));
    // Intentionally runs once per tab: the entry page is the interesting one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
