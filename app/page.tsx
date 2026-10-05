import StickyCta from '@/components/StickyCta';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Photo from '@/components/Photo';
import CallbackForm from '@/components/CallbackForm';
import { offersJsonLd, JsonLd } from '@/lib/seo';

export const metadata = { alternates: { canonical: '/' } };

const LEVELS = [['0', 'Private', 'Only you and advisors you invite', 'Default'], ['1', 'Anonymous', 'General details, no name, no location', 'You approve'], ['2', 'Verified buyer', 'More detail for qualified buyers only', 'You approve'], ['3', 'Under NDA', 'Sensitive information after a signed NDA', 'You approve'], ['4', 'Due diligence', 'Full data room, logged and revocable', 'You approve']];

const STORIES = [
  { img: '/images/story-family.jpg', ph: 'A father and daughter walking through the factory gate', path: 'Family succession', q: 'A daughter is open to taking over but wants to know what she is inheriting. A dated plan and three scores give the family something to discuss besides feelings.', who: 'Example scenario' },
  { img: '/images/story-mbo.jpg', ph: 'An operations manager on the shop floor with his team', path: 'Management buyout', q: 'The operations head could run the business, but every key customer still calls the owner. The plan moves those relationships first, and the Independence score shows the progress.', who: 'Example scenario' },
  { img: '/images/story-prepare.jpg', ph: 'An owner at his desk, reading old ledgers', path: 'Prepare first', q: 'An owner thinking of selling sees that unreconciled books and unsigned contracts would weaken any offer, so the first year goes into fixing them.', who: 'Example scenario' }
];

const PLANS = [
  { name: 'Assessment', tag: 'Start here', price: 'Free', desc: 'See where you stand, privately.', items: ['Full 7-minute assessment', 'Three core scores', 'Strengths and risks'], cta: 'Start free', href: '/assessment', hi: false },
  { name: 'Detailed Report', tag: 'Most owners choose this', price: '₹2,999', desc: 'Your full picture, explained and shareable with your CA.', items: ['Personalised written report', 'All ten paths analysed', 'Indicative value range with factors', 'Prioritised readiness plan'], cta: 'Start with the assessment', href: '/assessment', hi: true },
  { name: 'Readiness Program', tag: 'Quoted after a call', price: '₹25k–75k', desc: 'Guided preparation over 12 to 36 months, with your advisors in the loop. Typical range; your quote depends on scope.', items: ['Everything in Report', 'Financial & documentation preparation', 'Advisor coordination', 'Quarterly progress reviews'], cta: 'Request a call', href: '#callback', hi: false }
];

const HOW = [['7 min', 'Answer privately', 'About 40 questions on your role, team, customers and records. “I don’t know” is a valid answer.'], ['Instant', 'See three scores, with reasons', 'Transferability, Succession Readiness, Business Independence. Calculated by fixed, published rules, never by AI, with every component shown.'], ['Same day', 'Compare ten paths honestly', 'Family, management buyout, external buyer, gradual retirement, preparing first and more. How each fits, and why, in the Detailed Report.'], ['2–5 yrs', 'Prepare at your pace', 'A prioritised plan, a dashboard, and room for your CA and lawyer. Nothing goes public unless you say so.']];

export default function Home() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <style>{`.hero-l{padding:72px 56px 72px 0;border-right:1px solid var(--ink)}@media(max-width:1150px){.hero-l{border-right:0;padding:56px 0}.hero-cap{padding-left:0!important}}
      .trust{display:flex;flex-wrap:wrap;gap:6px 0}.trust span+span::before{content:'·';margin:0 14px}
      @media(max-width:520px){.trust{flex-direction:column}.trust span+span::before{content:none}}
      .hero-cap{padding:20px 0 20px 32px}
      .pos-cell{padding:28px 32px 28px 0}.pos-next{padding-left:32px;border-left:1px solid var(--rule-l)}
      @media(max-width:760px){.pos-cell,.pos-next{padding:24px 0;border-left:0}.pos-next{border-top:1px solid var(--rule-l)}}`}</style>
      <JsonLd data={offersJsonLd()} />
      <SiteHeader />

      <section className="wrap grid g-auto-420" style={{ gap: 0, borderBottom: '1px solid var(--ink)', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,520px),1fr))' }}>
        <div className="hero-l col between" style={{ gap: 56 }}>
          <div className="col gap28">
            <span className="eyebrow">For owners of established Indian businesses</span>
            <h1 className="h1-xl">You built it over thirty years. <em>Who runs it in the thirty-first?</em></h1>
            <p style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--t2)', margin: 0, maxWidth: 520 }}>A private, seven-minute assessment that tells you how transferable your business is today, and which succession paths genuinely fit. No listing. No obligation to sell.</p>
          </div>
          <div className="col gap16">
            <div className="row" style={{ gap: 14 }}>
              <Link href="/assessment" className="btn btn-green btn-lg">Check my succession readiness <span>→</span></Link>
              <Link href="#sample" className="link-u" style={{ fontSize: 15 }}>See a sample report</Link>
            </div>
            <div className="trust small muted"><span>Free to start</span><span>Private by default</span><span>No obligation to sell</span></div>
          </div>
        </div>
        <div className="col" style={{ minHeight: 520 }}>
          <Photo src="/images/hero-owner.jpg" priority position="center 30%" caption="An owner on the factory floor, looking at his team" style={{ flex: 1, minHeight: 460 }} />
          <div className="hero-cap row between rule-t" style={{ fontSize: 13 }}>
            <span className="serif" style={{ fontStyle: 'italic', fontSize: 15 }}>&ldquo;Not planning to sell. Planning to stop worrying.&rdquo;</span>
            <span className="muted">Why most owners start</span>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--tint)', borderBottom: '1px solid var(--ink)' }}>
        <div className="wrap grid g-auto-300" style={{ gap: 0 }}>
          {[['Unlike a listing site', 'Marketplaces start by asking your price. We start by asking whether the business can run without you.'], ['Nothing visible by default', 'Listings go public on day one. Here, buyers see nothing until you approve each level yourself.'], ['Selling is one of ten outcomes', 'Family, management, gradual retirement, preparing first. Each assessed honestly, none pushed.']].map(([h, p], i) => (
            <div key={h} className={'pos-cell col gap8' + (i ? ' pos-next' : '')}><span className="eyebrow">{h}</span><span style={{ fontSize: 15 }}>{p}</span></div>
          ))}
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 88, paddingBottom: 88 }}>
        <h2 className="h2" style={{ maxWidth: 760 }}>Every owner eventually has to answer these. Most answer them too late.</h2>
        <div className="grid g-auto-260" style={{ columnGap: 32, marginTop: 40 }}>
          {[['What happens to my business when I step away?', 'Family may not want it. A buyer may not exist yet. Doing nothing is also a decision.'], ['How ready is it for someone else to run?', 'If customers, suppliers and the bank all call you, the business is you. That’s fixable, given time.'], ['Who takes it forward if my plan falls through?', 'A second path, whether management, a strategic acquirer or an operator, protects employees and value.']].map(([h, p], i) => (
            <div key={h} className="col gap14 rule-t" style={{ padding: '28px 0' }}>
              <span className="serif" style={{ fontSize: 56, fontWeight: 300, lineHeight: 1, color: 'var(--gold)' }}>{i + 1}</span>
              <span className="serif" style={{ fontSize: 24, lineHeight: 1.2 }}>{h}</span>
              <span className="t2" style={{ fontSize: 14.5 }}>{p}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="how" style={{ background: 'var(--dark)', color: 'var(--paper)' }}>
        <div className="wrap grid g-auto-420" style={{ paddingTop: 96, paddingBottom: 96, gap: 64, alignItems: 'center' }}>
          <div className="col">
            <span className="eyebrow" style={{ color: 'var(--gold-d)', marginBottom: 24 }}>What happens after you start</span>
            {HOW.map(([t, h, p], i) => (
              <div key={h} className="row" style={{ alignItems: 'flex-start', gap: 24, padding: '24px 0', borderTop: '1px solid var(--dark-r)', borderBottom: i === 3 ? '1px solid var(--dark-r)' : 0, flexWrap: 'nowrap' }}>
                <span className="serif" style={{ fontSize: 15, color: 'var(--gold-d)', minWidth: 72, paddingTop: 6 }}>{t}</span>
                <div className="col gap6"><span className="serif" style={{ fontSize: 26 }}>{h}</span><span style={{ fontSize: 14.5, color: '#B8B2A5' }}>{p}</span></div>
              </div>
            ))}
          </div>
          <Photo src="/images/how-meeting.jpg" caption="A second-line manager runs the meeting while the owner observes: the handover in progress" style={{ minHeight: 520 }} />
        </div>
      </section>

      <section id="sample" className="wrap grid g-auto-420" style={{ paddingTop: 96, paddingBottom: 96, gap: 64, alignItems: 'start' }}>
        <div className="col gap20" style={{ position: 'sticky', top: 32 }}>
          <h2 className="h2">A report your CA would respect and your family could read.</h2>
          <p className="t2" style={{ fontSize: 16, margin: 0 }}>Facts you supplied are always separated from interpretation. Every score shows its components and weights. Indicative value shows the factors, not just a number.</p>
          <Link href="/report/sample" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }}>Open the full sample report →</Link>
        </div>
        <div className="card col gap24" style={{ padding: 36, boxShadow: '12px 12px 0 #E6DFD0' }}>
          <div className="row between xs muted rule-b" style={{ paddingBottom: 12 }}><span style={{ letterSpacing: '.12em', textTransform: 'uppercase' }}>Succession report · sample</span><span>Distribution · Rajasthan · 18 yrs</span></div>
          <p className="serif" style={{ fontSize: 24, lineHeight: 1.3, margin: 0, fontWeight: 300 }}>Your business looks transferable. The next step is making it independent of you.</p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 0, borderTop: '1px solid var(--rule-l)', borderBottom: '1px solid var(--rule-l)' }}>
            {[['Transferability', 74], ['Readiness', 62], ['Independence', 48]].map(([k, v], i) => (
              <div key={k} className="col gap6" style={{ padding: '18px 16px', borderLeft: i ? '1px solid var(--rule-l)' : 0, paddingLeft: i ? 16 : 0 }}>
                <span className="xs muted">{k}</span><span className="big" style={{ fontSize: 48, color: Number(v) < 55 ? 'var(--warn)' : undefined }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="col gap10" style={{ fontSize: 14.5 }}>
            {[['Family succession', 'High fit'], ['Gradual retirement', 'High fit'], ['Management buyout', 'Medium fit'], ['External entrepreneur', 'Medium fit']].map(([k, v]) => (
              <div key={k} className="row between"><span>{k}</span><span style={{ color: v === 'High fit' ? 'var(--green)' : 'var(--gold)' }}>{v}</span></div>
            ))}
          </div>
          <div className="row between rule-t" style={{ paddingTop: 16, alignItems: 'baseline' }}><span className="small muted">Indicative enterprise value</span><span className="serif" style={{ fontSize: 28 }}>₹5.5 – 6.8 Cr</span></div>
        </div>
      </section>

      <section id="stories" className="rule-t rule-b">
        <div className="wrap col gap8" style={{ paddingTop: 56 }}>
          <span className="eyebrow">How it plays out</span>
          <h2 className="h2" style={{ margin: 0 }}>Three common situations.</h2>
          <span className="small muted">Composite examples to show how the assessment is used, not stories of specific clients. Photos are illustrative.</span>
        </div>
        <div className="wrap grid g-auto-300" style={{ columnGap: 32 }}>
          {STORIES.map((s) => (
            <div key={s.path} className="col gap20" style={{ padding: '48px 0' }}>
              <Photo src={s.img} caption={s.ph} sizes="(max-width: 760px) 100vw, 33vw" style={{ aspectRatio: '4/3' }} />
              <span className="eyebrow">{s.path}</span>
              <p className="serif" style={{ fontWeight: 300, fontSize: 24, lineHeight: 1.25, margin: 0 }}>{s.q}</p>
              <span className="small muted">{s.who}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 96, paddingBottom: 96 }}>
        <div className="col gap20" style={{ maxWidth: 760 }}>
          <span className="eyebrow">A note from the founder</span>
          <p className="serif" style={{ fontWeight: 300, fontSize: 'clamp(22px,2.4vw,30px)', lineHeight: 1.35, margin: 0 }}>Too many valuable family businesses close not because they lack value, but because nobody planned how they would run without the founder, and nobody knew who to ask.</p>
          <p className="t2" style={{ fontSize: 16, margin: 0 }}>Legacy Handover exists so that conversation starts years earlier, privately, with numbers instead of anxiety. We are not a listing site. Selling is one of ten outcomes, and &ldquo;not yet&rdquo; is a perfectly good answer. Our job is to make sure that whatever you choose, the business and the people in it are ready.</p>
          <span className="serif" style={{ fontStyle: 'italic', fontSize: 18 }}>Karan Bindal, Founder</span>
        </div>
      </section>

      <section id="privacy" style={{ background: 'var(--green)', color: 'var(--paper)' }}>
        <div className="wrap grid g-auto-420" style={{ paddingTop: 88, paddingBottom: 88, gap: 64 }}>
          <div className="col gap20">
            <h2 className="h2">Your staff, customers and competitors learn nothing unless you decide otherwise.</h2>
            <p style={{ fontSize: 16, color: 'var(--on-green)', margin: 0 }}>Everything starts at Level 0. Each step up is your explicit approval. Every view, download and access grant is logged and revocable.</p>
          </div>
          <div className="col">
            {LEVELS.map((l) => (
              <div key={l[0]} className="grid" style={{ gridTemplateColumns: '52px 1fr auto', gap: 16, alignItems: 'baseline', padding: '16px 0', borderTop: '1px solid var(--green-r)' }}>
                <span className="serif" style={{ fontSize: 22, color: 'var(--gold-d)' }}>L{l[0]}</span>
                <div className="col gap4"><span style={{ fontSize: 16 }}>{l[1]}</span><span style={{ fontSize: 13.5, color: 'var(--on-green-m)' }}>{l[2]}</span></div>
                <span className="xs" style={{ color: 'var(--on-green-m)' }}>{l[3]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="wrap" style={{ paddingTop: 96, paddingBottom: 96 }}>
        <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 40, gap: 24 }}>
          <h2 className="h2">Start free. Pay only when it&rsquo;s useful.</h2>
          <span className="muted" style={{ fontSize: 14 }}>Prices in Indian Rupees · No GST charged</span>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 0, borderTop: '1px solid var(--ink)', borderLeft: '1px solid var(--ink)' }}>
          {PLANS.map((p) => (
            <div key={p.name} className="col gap16" style={{ borderRight: '1px solid var(--ink)', borderBottom: '1px solid var(--ink)', padding: 32, background: p.hi ? 'var(--card)' : 'transparent' }}>
              <div className="row between" style={{ alignItems: 'baseline' }}><span className="eyebrow">{p.name}</span><span className="xs muted">{p.tag}</span></div>
              <span className="big" style={{ fontSize: 44 }}>{p.price}</span>
              <span className="t2" style={{ fontSize: 15 }}>{p.desc}</span>
              <div className="col gap8 rule-tl" style={{ flex: 1, paddingTop: 16 }}>
                {p.items.map((i) => <span key={i} className="row" style={{ fontSize: 14.5, gap: 10, flexWrap: 'nowrap' }}><span style={{ color: 'var(--gold)' }}>—</span>{i}</span>)}
              </div>
              <Link href={p.href} className={'btn' + (p.hi ? '' : ' btn-ghost')}>{p.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      <section id="callback" className="rule-t">
        <div className="wrap grid g-auto-380" style={{ paddingTop: 80, paddingBottom: 80, gap: 56, alignItems: 'center' }}>
          <div className="col gap16">
            <h2 className="h2" style={{ fontSize: 'clamp(32px,4vw,56px)' }}>Prefer to talk first?</h2>
            <p className="t2" style={{ fontSize: 16, margin: 0, maxWidth: 480 }}>A 20-minute private call with our team. No pitch. We&rsquo;ll tell you honestly whether the assessment is worth your time.</p>
          </div>
          <CallbackForm />
        </div>
      </section>

      <SiteFooter />
      <StickyCta />
    </div>
  );
}
