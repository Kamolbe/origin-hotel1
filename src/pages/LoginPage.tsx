import { usesHotelServer } from '../services/hotelServer';
import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Logo } from '../components/Logo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { optimizedUnsplashUrl, unsplashSrcSet } from '../services/imageUtils';
import type { GoogleProfile } from '../services/googleAuth';

const authPhoto = 'https://images.unsplash.com/photo-1660557989695-14fac79c086d?auto=format&fit=crop&w=1600&q=88';

/** Demo accounts shown behind the collapsible hint. Kept compact so the panel never needs to scroll. */
const demoAccounts = [
  { role: 'Administrator', email: 'admin@admin.com', password: 'Admin2026!', code: 'admin1234' },
  { role: 'Menejer', email: 'manager@manager.com', password: 'Manager2026!', code: 'manager1234' },
  { role: 'Mehmon', email: 'user@origin.uz', password: 'User2026!', code: '' },
];

export function LoginPage() {
  const { t } = useTranslation();
  const { user, login, register, signInWithGoogle } = useAuth();
  const { success } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const requested = (location.state as { from?: string } | null)?.from;
  const reason = (location.state as { reason?: string } | null)?.reason;
  const destination = user?.role === 'admin' || user?.role === 'manager' ? '/app' : requested?.startsWith('/app') ? requested : window.matchMedia('(max-width: 767px)').matches ? '/' : '/app';
  // Arriving here from a protected page is explained instead of feeling like a bounce.
  const notice = reason === 'booking'
    ? 'Bronni yakunlash uchun tizimga kiring yoki bir necha qadamda hisob yarating. Tanlagan sanalaringiz saqlanadi.'
    : requested
      ? 'Davom etish uchun tizimga kiring — kirgandan so‘ng o‘sha sahifaga qaytasiz.'
      : '';
  const forwardedState = { bookingSearch: (location.state as { bookingSearch?: unknown } | null)?.bookingSearch, selectedRoomType: (location.state as { selectedRoomType?: string } | null)?.selectedRoomType };
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const specialDomain = useMemo(() => !usesHotelServer() && /@(admin|manager)\.com$/i.test(email.trim()), [email]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true); setError('');
    try {
      const result = mode === 'login'
        ? await login({ email, password, accessCode, name: `${firstName} ${lastName}`.trim() })
        : await register({ firstName, lastName, email, password, accessCode });
      if (!result.ok) {
        const message = result.error === 'code' ? t('auth.invalidCode') : result.error === 'duplicate' ? 'Bu email bilan hisob mavjud.' : result.error === 'email' ? 'Maydonlarni to‘g‘ri to‘ldiring. Parol kamida 6 belgidan iborat bo‘lsin.' : t('auth.invalidCredentials');
        setError(result.message ?? message); return;
      }
      success(mode === 'register' ? 'Hisobingiz yaratildi.' : 'Tizimga muvaffaqiyatli kirdingiz.');
      navigate(result.role === 'admin' || result.role === 'manager' ? '/app' : destination, { replace: true, state: forwardedState });
    } finally { setSubmitting(false); }
  }

  const handleGoogleProfile = useCallback(async (profile: GoogleProfile) => {
    const result = await signInWithGoogle(profile);
    if (!result.ok) {
      setError(result.message ?? (result.error === 'code' ? t('auth.invalidCode') : result.error === 'email' ? 'Google hisobidagi email manzil yaroqsiz.' : t('auth.invalidCredentials')));
      return;
    }
    setError('');
    success('Tizimga muvaffaqiyatli kirdingiz.');
    navigate(destination, { replace: true, state: forwardedState });
  }, [signInWithGoogle, t, success, navigate, destination, forwardedState]);

  if (user) return <Navigate to={destination} replace state={forwardedState} />;

  return <div className="auth-page grid h-dvh overflow-hidden bg-[var(--page)] lg:grid-cols-[.95fr_1.05fr]">
    <section className="auth-art relative hidden h-full min-h-0 overflow-hidden bg-ink lg:block">
      <img src={optimizedUnsplashUrl(authPhoto, 1280, 76)} srcSet={unsplashSrcSet(authPhoto, [640, 960, 1280, 1600], 76)} sizes="(min-width: 1024px) 48vw, 100vw" width={1600} height={1200} alt="Origin Hotel qabulxonasi" loading="eager" decoding="async" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/55 to-ink/90" />
      <div className="relative flex h-full min-h-0 flex-col justify-between p-10 xl:p-14">
        <Logo light />
        <div className="mb-6 max-w-xl text-white">
          <p className="mb-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.25em] text-[#dfc798]"><span className="h-px w-8 bg-champagne" />Origin mehmondo‘stligi</p>
          <h1 className="font-display text-5xl leading-[1.08] xl:text-6xl">Qaytishni istaydigan manzil.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/70">Har bir tashrifda osoyishtalik, mayda e’tiborlar va qulay xizmat.</p>
          <div className="auth-art-badges mt-8 flex flex-wrap gap-2">{['24/7 xizmat', 'Spa & basseyn', 'Shahar markazi'].map((item) => <span key={item} className="rounded-full border border-white/20 bg-white/5 px-3 py-2 text-[10px] text-white/80"><Sparkles size={11} className="mr-1.5 inline text-champagne" />{item}</span>)}</div>
          <div className="auth-art-quote mt-10 max-w-md rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md"><div className="flex gap-1 text-champagne" aria-hidden="true"><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /></div><p className="mt-3 font-display text-xl leading-7">“Kelishdan ketishgacha hammasi nozik e’tibor bilan.”</p><p className="mt-3 text-[10px] text-white/55">— Madina R., mehmon</p></div>
        </div>
        <p className="text-[9px] uppercase tracking-[.18em] text-white/45">Unsplash surati · haqiqiy manzil demo uchun</p>
      </div>
    </section>
    <section className="auth-form-panel flex h-full min-h-0 flex-col overflow-y-auto px-5 py-3 sm:px-9 lg:px-12 xl:px-20">
      <div className="flex items-center justify-between"><Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition hover:text-champagne"><ArrowLeft size={15} />Bosh sahifaga</Link><LanguageSwitcher /></div>
      <div className="auth-content mx-auto my-auto w-full max-w-md py-2">
        <div className="auth-brand mb-6 lg:hidden"><Logo /></div>
        <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.24em] text-champagne">Origin Hotel · Mehmonlar portali</p><h2 className="font-display text-4xl">{mode === 'login' ? t('auth.welcome') : t('auth.register')}</h2><p className="mt-2 text-sm text-muted">{mode === 'login' ? 'Hisobingizga kiring va bronlaringizni boshqaring.' : 'Bir necha qadamda hisob yarating.'}</p></div>
        {notice && <p role="status" className="auth-notice mt-4 flex items-start gap-2 rounded-2xl border border-champagne/45 bg-champagne/10 px-4 py-3 text-[11px] leading-5 text-[var(--text)]"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-champagne" />{notice}</p>}
        <div className="auth-mode-switch mt-4 grid grid-cols-2 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1"><button type="button" aria-pressed={mode === 'login'} onClick={() => { setMode('login'); setError(''); }} className={`rounded-full px-4 py-2.5 text-xs font-bold transition ${mode === 'login' ? 'bg-ink text-white' : 'text-muted hover:text-champagne'}`}>{t('auth.signIn')}</button><button type="button" aria-pressed={mode === 'register'} onClick={() => { setMode('register'); setError(''); }} className={`rounded-full px-4 py-2.5 text-xs font-bold transition ${mode === 'register' ? 'bg-ink text-white' : 'text-muted hover:text-champagne'}`}>{t('auth.register')}</button></div>
        <GoogleSignInButton onProfile={handleGoogleProfile} onError={setError} />
        <div className="my-3 flex items-center gap-3"><span className="h-px flex-1 bg-[var(--line)]" /><span className="text-[9px] uppercase tracking-[.12em] text-muted">yoki email orqali</span><span className="h-px flex-1 bg-[var(--line)]" /></div>

        <form onSubmit={onSubmit} key={mode} className="animate-rise-in space-y-3">
          {mode === 'register' && <div className="grid grid-cols-2 gap-3"><Field label={t('auth.firstName')} value={firstName} onChange={setFirstName} required /><Field label={t('auth.lastName')} value={lastName} onChange={setLastName} required /></div>}
          <Field label={t('auth.email')} type="email" value={email} onChange={(value) => { setEmail(value); setError(''); }} autoComplete="email" required placeholder="ism@example.com" />
          <label className="block"><span className="mb-1.5 block text-xs font-semibold">{t('auth.password')}</span><span className="relative block"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'register' ? 6 : undefined} placeholder="••••••••" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 pr-11 text-sm outline-none transition focus:border-champagne" /><button type="button" aria-label="Parolni ko‘rsatish" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-champagne">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
          {specialDomain && <label className="block animate-rise-in"><span className="mb-1.5 flex items-center gap-2 text-xs font-semibold"><KeyRound size={13} className="text-champagne" />{t('auth.specialCode')}</span><input type="password" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} required autoComplete="off" placeholder="••••••••" className="w-full rounded-xl border border-champagne/50 bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-champagne" /></label>}
          {error && <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-xs text-danger">{error}</p>}
          <button type="submit" disabled={submitting} aria-busy={submitting} className="flex w-full disabled:opacity-50 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 text-xs font-bold text-white transition hover:bg-ink-soft">{mode === 'login' ? t('auth.signIn') : t('auth.register')}<ArrowRight size={14} /></button>
        </form>
        {!usesHotelServer() && <button type="button" onClick={() => setShowDemo((open) => !open)} className="mt-5 flex items-center gap-2 text-[10px] font-semibold text-muted transition hover:text-champagne"><ShieldCheck size={14} />Demo kirish ma’lumotlari <span>{showDemo ? '−' : '+'}</span></button>}
        {!usesHotelServer() && showDemo && <div className="mt-3 grid gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 text-[10px] leading-5 text-muted sm:grid-cols-3 sm:p-4">{demoAccounts.map((account) => <p key={account.role}><b className="text-[var(--text)]">{account.role}</b><span className="mt-0.5 block break-words">{account.email}<br />{account.password}{account.code && <><br />kod {account.code}</>}</span></p>)}</div>}
        <p className="auth-legal mt-3 text-center text-[10px] leading-5 text-muted">Kirish orqali Origin Hotel demo hisobidan foydalanishga rozilik bildirasiz.</p>
      </div>
      <div className="mx-auto flex w-full max-w-md items-center justify-between pb-2 text-[9px] text-muted"><span>© {new Date().getFullYear()} Origin Hotel</span><Link to="/" className="hover:text-champagne">OriginHotel.uz</Link></div>
    </section>
  </div>;
}

function Field({ label, value, onChange, type = 'text', required = false, placeholder, autoComplete }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string; autoComplete?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} autoComplete={autoComplete} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-champagne" /></label>;
}
