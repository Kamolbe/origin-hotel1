import { initializeApp, getApps } from 'firebase/app';
import { GoogleAuthProvider, getAuth, signInWithPopup, signOut, type Auth } from 'firebase/auth';

export type GoogleProfile = { id: string; email: string; name: string; picture?: string };

// Firebase web configuration is public. Never put a client secret here.
const firebaseConfig = {
  apiKey: 'AIzaSyB0V2FzD0O7H23h3-P0jJaA5_vk0wTV6Cs',
  authDomain: 'origin-hotel.firebaseapp.com',
  projectId: 'origin-hotel',
  storageBucket: 'origin-hotel.firebasestorage.app',
  messagingSenderId: '91387979562',
  appId: '1:91387979562:web:8df372021a1302ff872053',
};
let auth: Auth | undefined;
function firebaseAuth(): Auth {
  const app = getApps().find((item) => item.name === 'origin-hotel-auth') ?? initializeApp(firebaseConfig, 'origin-hotel-auth');
  return auth ??= getAuth(app);
}

export async function signInWithFirebaseGoogle(): Promise<GoogleProfile> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(firebaseAuth(), provider);
  if (!result.user.email || !result.user.emailVerified) {
    await signOut(firebaseAuth());
    throw new Error('google-unverified-email');
  }
  return { id: result.user.uid, email: result.user.email, name: result.user.displayName ?? result.user.email.split('@')[0], picture: result.user.photoURL ?? undefined };
}

export async function signOutFirebaseGoogle(): Promise<void> {
  if (auth) await signOut(auth);
}

export function googleSignInError(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  switch (code) {
    case 'auth/unauthorized-domain': return 'Bu domen Firebase’da ruxsat etilmagan. Authentication → Settings → Authorized domains ro‘yxatiga sayt domenini qo‘shing.';
    case 'auth/operation-not-allowed': return 'Firebase Authentication’da Google orqali kirish yoqilmagan.';
    case 'auth/popup-blocked': return 'Brauzer kirish oynasini blokladi. Shu sayt uchun popup oynalariga ruxsat bering va qayta urining.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request': return 'Google orqali kirish bekor qilindi. Qayta urinishingiz mumkin.';
    case 'auth/network-request-failed': return 'Tarmoqqa ulanishda xatolik. Internetni tekshirib, qayta urining.';
    case 'auth/invalid-api-key':
    case 'auth/configuration-not-found': return 'Firebase loyiha sozlamalarini va Authentication yoqilganini tekshiring.';
    case 'auth/account-exists-with-different-credential': return 'Bu email boshqa kirish usuli bilan ro‘yxatdan o‘tgan. Avval o‘sha usul bilan kiring.';
    default: return 'Google orqali kirib bo‘lmadi. Qayta urinib ko‘ring.';
  }
}
