import 'server-only';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Firebase Phone Auth: the browser sends and confirms the SMS code with Firebase, then hands us an ID token.
// We verify it against Google's public keys (no service account needed) and trust only its phone_number.
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

export function firebaseEnabled() {
  return !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

export async function verifyFirebasePhone(idToken: string): Promise<string | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId || !idToken) return null;
  try {
    const { payload } = await jwtVerify(idToken, JWKS, { issuer: `https://securetoken.google.com/${projectId}`, audience: projectId, algorithms: ['RS256'] });
    const phone = typeof payload.phone_number === 'string' ? payload.phone_number : null;
    if (!phone || !payload.sub || (payload.auth_time as number) * 1000 < Date.now() - 10 * 60 * 1000) return null;
    return /^\+91[6-9]\d{9}$/.test(phone) ? phone : null;
  } catch {
    return null;
  }
}
