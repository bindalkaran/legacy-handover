'use client';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, signOut, type ConfirmationResult } from 'firebase/auth';

export const firebaseConfigured = !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

function auth() {
  const app = getApps()[0] ?? initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  });
  const a = getAuth(app);
  a.languageCode = 'en';
  return a;
}

let verifier: RecaptchaVerifier | null = null;

/** Sends the SMS via Firebase (invisible reCAPTCHA). Returns a confirm function that yields a Firebase ID token. */
export async function sendFirebaseCode(phoneE164: string, buttonId: string): Promise<(code: string) => Promise<string>> {
  const a = auth();
  verifier?.clear();
  verifier = new RecaptchaVerifier(a, buttonId, { size: 'invisible' });
  let conf: ConfirmationResult;
  try { conf = await signInWithPhoneNumber(a, phoneE164, verifier); }
  catch (e) { verifier.clear(); verifier = null; throw e; }
  return async (code: string) => {
    const cred = await conf.confirm(code);
    const token = await cred.user.getIdToken();
    await signOut(a); // our own session cookie takes over from here
    return token;
  };
}

export function firebaseError(e: unknown) {
  const c = (e as { code?: string })?.code || '';
  if (c.includes('invalid-verification-code')) return 'That code doesn’t match. Check and try again.';
  if (c.includes('code-expired')) return 'That code has expired. Request a new one.';
  if (c.includes('too-many-requests')) return 'Too many attempts. Please wait a while and try again.';
  if (c.includes('invalid-phone-number')) return 'Enter a valid 10-digit Indian mobile number.';
  return 'We could not send or check the code just now. Please try again in a minute.';
}
