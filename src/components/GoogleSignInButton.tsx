import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoaderCircle } from 'lucide-react';
import { googleSignInError, signInWithFirebaseGoogle, type GoogleProfile } from '../services/googleAuth';

export function GoogleSignInButton({ onProfile, onError }: {
  onProfile: (profile: GoogleProfile) => void;
  onError: (message: string) => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  async function signIn() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    onError('');
    try { onProfile(await signInWithFirebaseGoogle()); }
    catch (error) { onError(googleSignInError(error)); }
    finally { pending.current = false; setBusy(false); }
  }
  return <div className="mt-5">
    <button type="button" onClick={signIn} disabled={busy} aria-busy={busy} className="flex w-full items-center justify-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-xs font-semibold text-[var(--text)] transition hover:border-champagne disabled:cursor-wait disabled:opacity-60">
      {busy ? <LoaderCircle size={16} className="animate-spin" /> : <GoogleGlyph />}{busy ? 'Google bilan ulanmoqda…' : t('auth.google')}
    </button>
    <p className="auth-google-hint mt-2 text-center text-[10px] text-muted">{t('auth.googleTrust')}</p>
  </div>;
}

/** Google's four-colour mark, drawn inline so it needs no extra request. */
export function GoogleGlyph({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
    <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
  </svg>;
}
