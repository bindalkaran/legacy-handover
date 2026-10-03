import Link from 'next/link';
import Wordmark from './Wordmark';
import MobileMenu from './MobileMenu';

const NAV = [['/guides/family-business-succession', 'Guides'], ['/professionals', 'Professionals'], ['/#pricing', 'Pricing'], ['/acquire', 'For acquirers'], ['/advisor', 'For advisors']];

export default function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="rule-b" style={{ position: 'relative' }}>
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
        <MobileMenu links={[['/#how', 'How it works'], ['/#stories', 'Owner stories'], ...NAV, ['/sign-in', 'Sign in']]} />
      </div>
    </header>
  );
}
