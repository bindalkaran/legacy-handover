import Link from 'next/link';

export type NavItem = { href: string; label: string; badge?: string | number; on?: boolean; external?: boolean };

export default function Shell({ variant = 'green', nav, extra, footer, children, top }: { variant?: 'green' | 'line'; nav: NavItem[]; extra?: NavItem[]; footer?: React.ReactNode; top?: React.ReactNode; children: React.ReactNode }) {
  const green = variant === 'green';
  return (
    <div className="shell">
      <div className={'mobilebar' + (green ? ' green' : '')}>
        <div className="row between" style={{ padding: '12px 20px', flexWrap: 'nowrap' }}>
          <Link href="/" className="serif" style={{ fontSize: 20 }}>Legacy <em style={{ fontWeight: 300 }}>Handover</em></Link>
          <details className="menu">
            <summary className="btn btn-sm" style={{ background: 'transparent', color: 'inherit', borderColor: 'currentColor' }}>Menu</summary>
            <div className="col" style={{ position: 'absolute', left: 0, right: 0, background: green ? 'var(--green)' : 'var(--paper)', zIndex: 30, fontSize: 15 }}>
              {(extra || []).map((n) => <Link key={n.href} href={n.href} style={{ padding: '14px 20px', borderTop: '1px solid ' + (green ? 'var(--green-r)' : 'var(--ink)') }}>{n.label}</Link>)}
              <form action="/api/sign-out" method="post"><button style={{ padding: '14px 20px', background: 'none', border: 0, borderTop: '1px solid ' + (green ? 'var(--green-r)' : 'var(--ink)'), width: '100%', textAlign: 'left', color: 'inherit' }}>Sign out</button></form>
            </div>
          </details>
        </div>
        <nav>{nav.map((n) => <Link key={n.href} href={n.href} className={n.on ? 'on' : ''}>{n.label}{n.badge ? <span style={{ fontSize: 12, color: 'var(--gold-d)', marginLeft: 6 }}>{n.badge}</span> : null}</Link>)}</nav>
      </div>
      <aside className={'side ' + (green ? 'side-green' : 'side-line')}>
        <Link href="/" className="serif" style={{ fontSize: 21, padding: '0 8px', color: green ? 'var(--paper)' : 'var(--ink)' }}>Legacy <em style={{ fontWeight: 300, color: green ? 'var(--gold-d)' : undefined }}>Handover</em></Link>
        {top}
        <nav>
          {nav.map((n) => <Link key={n.href} href={n.href} className={'navi' + (n.on ? ' on' : '')}>{n.label}{n.badge ? <span className="badge">{n.badge}</span> : null}</Link>)}
          {(extra || []).map((n) => <Link key={n.href} href={n.href} className="navi">{n.label}{n.badge ? <span className="badge">{n.badge}</span> : <span>↗</span>}</Link>)}
          <form action="/api/sign-out" method="post"><button className="navi" style={{ width: '100%' }}>Sign out</button></form>
        </nav>
        {footer && <div style={{ marginTop: 'auto' }}>{footer}</div>}
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
