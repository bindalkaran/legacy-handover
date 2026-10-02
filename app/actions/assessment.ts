'use server';
import { currentUser } from '@/lib/auth';
import { saveDraft, finishAssessment } from '@/lib/owner';

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
  if (!r) return { ok: false as const, error: 'We couldn’t find your answers. Please try again.' };
  return { ok: true as const };
}
