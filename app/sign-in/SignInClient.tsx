'use client';
import { useState } from 'react';
import OtpForm from '@/components/OtpForm';

const R = [['owner', 'Owner', 'Welcome back', 'Continue your assessment or open your dashboard.'], ['buyer', 'Acquirer', 'Sign in as an acquirer', 'Your matches and access requests are waiting.'], ['advisor', 'Advisor', 'Advisor sign in', 'See the clients who have invited you.']] as const;

export default function SignInClient({ initialRole, next, roleChosen }: { initialRole: number; next?: string; roleChosen?: boolean }) {
  const [role, setRole] = useState(initialRole);
  const [picked, setPicked] = useState(!!roleChosen);
  return (
    <div className="col gap28" style={{ width: '100%', maxWidth: 420 }}>
      <div className="row" style={{ gap: 0, border: '1px solid var(--ink)', fontSize: 14, flexWrap: 'nowrap' }}>
        {R.map((r, i) => <button key={r[0]} onClick={() => { setRole(i); setPicked(true); }} style={{ flex: 1, padding: 12, border: 0, background: role === i ? 'var(--ink)' : 'transparent', color: role === i ? 'var(--paper)' : 'var(--ink)' }}>{r[1]}</button>)}
      </div>
      <div className="col gap8">
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 36, letterSpacing: '-.025em', margin: 0 }}>{R[role][2]}</h1>
        <p className="t2" style={{ margin: 0, fontSize: 15 }}>{R[role][3]}</p>
      </div>
      <OtpForm key={role} role={R[role][0]} next={next} explicit={picked} />
      <span className="xs muted" style={{ lineHeight: 1.55 }}>We never contact your staff, customers or family.</span>
    </div>
  );
}
