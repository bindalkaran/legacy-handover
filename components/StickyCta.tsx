'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

/** Phone-only bottom bar on Home: appears after 600px of scroll, hidden while the menu is open. */
export default function StickyCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 600 && window.innerWidth < 700 && document.documentElement.dataset.menu !== 'open');
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, []);
  useEffect(() => { document.body.style.paddingBottom = show ? '76px' : ''; }, [show]);
  if (!show) return null;
  return (
    <div className="noprint row" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 20, background: 'var(--paper)', borderTop: '1px solid var(--ink)', padding: '10px 16px calc(10px + env(safe-area-inset-bottom))', gap: 10, flexWrap: 'nowrap' }}>
      <Link href="/assessment" className="btn btn-green" style={{ flex: 1 }}>Check my succession readiness</Link>
      <a href="#callback" className="btn btn-ghost">Call</a>
    </div>
  );
}
