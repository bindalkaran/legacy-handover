'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MobileMenu({ links }: { links: string[][] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.menu = open ? 'open' : '';
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const close = () => setOpen(false);
  return (
    <div className="sh-menu" style={{ flexBasis: 'auto' }}>
      <button className="btn btn-ghost btn-sm" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}</button>
      {open && (
        <nav className="col" style={{ position: 'absolute', left: 0, right: 0, background: 'var(--paper)', zIndex: 30, padding: '0 16px 16px', borderBottom: '1px solid var(--ink)', fontSize: 17 }}>
          {links.map(([h, t]) => <Link key={h} href={h} onClick={close} style={{ padding: '14px 0', borderBottom: '1px solid var(--rule-l)' }}>{t}</Link>)}
          <Link href="/assessment" onClick={close} className="btn btn-green btn-lg" style={{ marginTop: 16 }}>Check my succession readiness</Link>
        </nav>
      )}
    </div>
  );
}
