import Wordmark from '@/components/Wordmark';
import SignInClient from './SignInClient';

export const metadata = { title: 'Sign in' };

export default async function SignIn({ searchParams }: { searchParams: Promise<{ role?: string; next?: string }> }) {
  const sp = await searchParams;
  const initial = sp.role === 'buyer' ? 1 : sp.role === 'advisor' ? 2 : 0;
  return (
    <div className="grid" style={{ minHeight: '100vh', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))', gap: 0 }}>
      <div className="panel-green col between" style={{ padding: 48, gap: 48 }}>
        <Wordmark color="var(--paper)" />
        <div className="col gap20" style={{ maxWidth: 460 }}>
          <p className="serif" style={{ fontWeight: 300, fontSize: 'clamp(28px,3vw,40px)', lineHeight: 1.15, margin: 0, letterSpacing: '-.02em' }}>Your account is private by default. Nothing here is visible to anyone unless you approve it.</p>
          <div className="col gap10" style={{ fontSize: 14, color: 'var(--on-green)' }}>
            <span>— Encrypted in transit and at rest</span><span>— No public listing is ever created automatically</span><span>— Export or delete your data at any time from Settings</span>
          </div>
        </div>
        <span className="small" style={{ color: 'var(--on-green-m)' }}>Plan the handover. Protect the legacy.</span>
      </div>
      <div style={{ display: 'grid', placeItems: 'center', padding: '48px 24px' }}>
        <SignInClient initialRole={initial} next={sp.next} />
      </div>
    </div>
  );
}
