import { currentUser } from '@/lib/auth';
import { getDraft } from '@/lib/owner';
import { one } from '@/lib/db';
import AssessmentClient from './AssessmentClient';

export const metadata = { title: 'Succession Assessment', description: 'Seven minutes. Entirely private. No decisions required.' };
export const dynamic = 'force-dynamic';

export default async function AssessmentPage({ searchParams }: { searchParams: Promise<{ retake?: string; invite?: string }> }) {
  const user = await currentUser();
  const sp = await searchParams;
  const inviter = sp.invite && /^[\w-]{8,40}$/.test(sp.invite) ? await one(`SELECT u.name, u.firm FROM advisor_links al JOIN users u ON u.id = al.advisor_user_id WHERE al.token = $1 AND al.business_id IS NULL`, [sp.invite]) : null;
  let draft = await getDraft(user);
  let answers = (draft?.answers as Record<string, number>) || {};
  let step = draft?.step ?? 0;
  // Retake: prefill from the last completed assessment so owners only change what moved.
  if (!draft && user && sp.retake) {
    const last = await one(`SELECT answers FROM assessments WHERE user_id = $1 AND status = 'complete' ORDER BY completed_at DESC LIMIT 1`, [user.id]);
    if (last) { answers = last.answers; step = 0; }
  }
  return <AssessmentClient initialAnswers={answers} initialStep={step} hasDraft={!!draft && Object.keys(answers).length > 0} signedIn={!!user} invite={inviter ? { token: sp.invite!, by: [inviter.name, inviter.firm].filter(Boolean).join(', ') || 'your advisor' } : undefined} />;
}
