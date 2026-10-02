import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="wrap-m col gap16" style={{ padding: '96px 24px', maxWidth: 640 }}>
      <span className="eyebrow">Not found</span>
      <h1 className="page-title">This page doesn&rsquo;t exist, or you don&rsquo;t have access to it.</h1>
      <div className="row gap10"><Link href="/" className="btn">Home</Link><Link href="/sign-in" className="btn btn-ghost">Sign in</Link></div>
    </main>
  );
}
