import Link from 'next/link';
import Wordmark from './Wordmark';

const NAV = [['/guides/family-business-succession', 'Guides'], ['/professionals', 'Professionals'], ['/#pricing', 'Pricing'], ['/acquire', 'For acquirers'], ['/advisor', 'For advisors']];

export default function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="rule-b">
      <style>{`.sh-nav{display:flex;gap:28px;font-size:14px;white-space:nowrap}.sh-right{display:flex;gap:20px;font-size:14px;align-items:center;white-space:nowrap}.sh-menu{display:none}
      @media(max-width:900px){.sh-nav,.sh-right{display:none}.sh-menu{display:block}}`}</style>
      <div className="wrap" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', minHeight: 64, gap: '12px 32px', paddingTop: 12, paddingBottom: 12 }}>
        <Wordmark />
        <nav className="sh-nav">
          {NAV.map(([h, t]) => <Link key={h} href={h} style={active === t ? { borderBottom: '1px solid var(--ink)' } : undefined}>{t}</Link>)}
        </nav>
        <div className="sh-right">
          <Link href="/sign-in">Sign in</Link>
          <Link href="/assessment" className="btn" style={{ padding: '10px 16px', minHeight: 0 }}>Start assessment</Link>
        </div>
        <details className="menu sh-menu" style={{ flexBasis: 'auto' }}>
          <summary className="btn btn-ghost btn-sm">Menu</summary>
          <nav className="col" style={{ position: 'absolute', left: 0, right: 0, background: 'var(--paper)', zIndex: 30, padding: '0 16px 16px', borderBottom: '1px solid var(--ink)', fontSize: 17 }}>
            {[['/#how', 'How it works'], ['/#stories', 'Owner stories'], ...NAV, ['/sign-in', 'Sign in']].map(([h, t]) => <Link key={h} href={h} style={{ padding: '14px 0', borderBottom: '1px solid var(--rule-l)' }}>{t}</Link>)}
            <Link href="/assessment" className="btn btn-green btn-lg" style={{ marginTop: 16 }}>Check my succession readiness</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
