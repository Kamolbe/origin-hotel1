/**
 * "Continue with Google", implemented with Google Identity Services (GIS).
 *
 * The integration is configured entirely through `VITE_GOOGLE_CLIENT_ID`: when
 * the variable is absent the app keeps working and the sign-in button reports
 * that Google sign-in has not been configured yet.
 *
 * The ID token is decoded here to read the verified profile (email, name,
 * picture). Signature verification is deliberately left to `accounts.google.com`
 * — a production deployment that must *trust* the token for server-side
 * authorisation has to verify it on a backend as well.
 */
export const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';



export type GoogleProfile = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

type GoogleCredentialResponse = { credential?: string };

type GoogleIdentityServices = {
  accounts: {
    id: {
      initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void; auto_select?: boolean; cancel_on_tap_outside?: boolean }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, string | number | boolean>) => void;
      disableAutoSelect?: () => void;
    };
  };
};

declare global {
  interface ImportMetaEnv {
    readonly VITE_GOOGLE_CLIENT_ID?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  interface Window {
    google?: GoogleIdentityServices;
  }
}

interface GoogleIdTokenClaims {
  iss?: string;
  aud?: string;
  exp?: number;
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
}

export function googleClientId(): string {
  const value = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  return typeof value === 'string' ? value.trim() : '';
}

export function isGoogleSignInConfigured(): boolean {
  return googleClientId().length > 0;
}

let loader: Promise<void> | null = null;

/** Loads the GIS client script once; a failed load clears the cache so a later
 *  attempt can retry instead of failing forever. */
export function loadGoogleIdentityServices(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('google-unavailable'));
  if (window.google?.accounts?.id) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => (window.google?.accounts?.id ? resolve() : reject(new Error('google-unavailable')));
    script.onerror = () => { loader = null; reject(new Error('google-unavailable')); };
    document.head.appendChild(script);
  });
  return loader;
}

function decodeBase64Url(segment: string): string {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Reads and sanity-checks the ID token Google returns for the signed-in user. */
export function readGoogleCredential(credential: string, clientId: string): GoogleProfile {
  const segments = credential.split('.');
  if (segments.length !== 3) throw new Error('google-malformed-token');

  const claims = JSON.parse(decodeBase64Url(segments[1])) as GoogleIdTokenClaims;
  if (claims.aud !== clientId) throw new Error('google-audience-mismatch');
  if (claims.iss !== 'accounts.google.com' && claims.iss !== 'https://accounts.google.com') throw new Error('google-invalid-issuer');
  if (typeof claims.exp === 'number' && claims.exp * 1000 <= Date.now()) throw new Error('google-expired-token');
  if (claims.email_verified !== true && claims.email_verified !== 'true') throw new Error('google-unverified-email');
  if (!claims.email || !claims.sub) throw new Error('google-incomplete-profile');

  return { id: claims.sub, email: claims.email, name: claims.name ?? claims.email.split('@')[0], picture: claims.picture };
}

/** Renders Google's own button into `parent` and reports the chosen account. */
export function renderGoogleButton(
  parent: HTMLElement,
  clientId: string,
  onCredential: (credential: string) => void,
  options: { theme?: 'outline' | 'filled_blue' | 'filled_black'; width?: number } = {},
): void {
  const identity = window.google?.accounts?.id;
  if (!identity) throw new Error('google-unavailable');

  identity.initialize({
    client_id: clientId,
    auto_select: false,
    cancel_on_tap_outside: true,
    callback: (response) => { if (response.credential) onCredential(response.credential); },
  });
  identity.renderButton(parent, {
    type: 'standard',
    theme: options.theme ?? 'outline',
    size: 'large',
    shape: 'pill',
    text: 'continue_with',
    logo_alignment: 'center',
    width: options.width ?? 360,
  });
}
