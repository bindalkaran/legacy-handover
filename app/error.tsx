'use client';
import Link from 'next/link';
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const db = /DATABASE_URL/.test(error.message || '');
  return (
    <main className="wrap-m col gap16" style={{ padding: '96px 24px', maxWidth: 640 }}>
      <span className="eyebrow">Legacy Handover</span>
      <h1 className="page-title">{db ? 'The database is not connected yet.' : 'Something went wrong on our side.'}</h1>
      <p className="t2">{db ? 'Connect Neon Postgres to this deployment (Vercel → Storage → Neon), then redeploy. Nothing you entered has been lost.' : 'Your answers and documents are saved. Please try again; if it keeps happening, request a call from the home page and we will help.'}</p>
      <div className="row gap10"><button className="btn" onClick={reset}>Try again</button><Link href="/" className="btn btn-ghost">Home</Link></div>
      {error.digest && <span className="xs muted">Reference {error.digest}</span>}
    </main>
  );
}
