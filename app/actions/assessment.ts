'use server';
import { currentUser } from '@/lib/auth';
import { saveDraft, finishAssessment } from '@/lib/owner';
import { q } from '@/lib/db';

export async function saveAssessment(answers: Record<string, number>, step: number) {
  const user = await currentUser();
  try { await saveDraft(user, answers, step); return { ok: true }; }
  catch { return { ok: false }; }
}

export async function completeAssessment(answers: Record<string, number>, step: number) {
  const user = await currentUser();
  await saveDraft(user, answers, step);
  if (!user) return { ok: false as const, needAuth: true };
  const r = await finishAssessment(user);
  // Completing an assessment makes this account an owner (it may already be an acquirer or advisor too).
  if (r) await q(`UPDATE users SET role = 'owner', roles = CASE WHEN 'owner' = ANY(roles) THEN roles ELSE array_append(roles, 'owner') END WHERE id = $1`, [user.id]);
  if (!r) return { ok: false as const, error: 'We couldn’t find your answers. Please try again.' };
  return { ok: true as const };
}
