import 'server-only';
import { REPORT_FREE } from './company';
import { cookies } from 'next/headers';
import { q, one, audit, track, config } from './db';
import { token, type User } from './auth';
import { compute, sanitiseAnswers, ASSESSMENT_VERSION, CALC_VERSION, type Answers } from './assessment';
import { generateTasks, type StoredScore } from './report';
import { DEFAULT_WEIGHTS } from '@/db/seed.mjs';
import { aiNarrative } from './ai';

const DRAFT_COOKIE = 'lh_draft';

export async function activeWeights(): Promise<{ version: string; weights: Record<string, number> }> {
  const version = await config<string>('active_score_version', 'score-v1.0');
  const row = await one(`SELECT weights FROM score_versions WHERE version = $1`, [version]);
  return { version, weights: (row?.weights as Record<string, number>) || DEFAULT_WEIGHTS };
}

export async function getDraft(user: User | null) {
  if (user) {
    const d = await one(`SELECT * FROM assessments WHERE user_id = $1 AND status = 'draft' ORDER BY updated_at DESC LIMIT 1`, [user.id]);
    if (d) return d;
  }
  const t = (await cookies()).get(DRAFT_COOKIE)?.value;
  if (t) {
    const d = await one(`SELECT * FROM assessments WHERE draft_token = $1 AND status = 'draft'`, [t]);
    if (d && (!d.user_id || d.user_id === user?.id)) return d;
  }
  return null;
}

export async function saveDraft(user: User | null, answersRaw: unknown, step: number) {
  const answers = sanitiseAnswers(answersRaw);
  const s = Math.max(0, Math.min(7, Math.floor(step) || 0));
  const existing = await getDraft(user);
  if (existing) {
    await q(`UPDATE assessments SET answers = $2::jsonb, step = $3, updated_at = now(), user_id = COALESCE(user_id, $4) WHERE id = $1`, [existing.id, JSON.stringify(answers), s, user?.id ?? null]);
    return existing.id as string;
  }
  const t = token();
  const biz = user ? await one(`SELECT id FROM businesses WHERE owner_id = $1 ORDER BY created_at LIMIT 1`, [user.id]) : null;
  const row = await one(`INSERT INTO assessments (user_id, business_id, draft_token, answers, step, assessment_version) VALUES ($1,$2,$3,$4::jsonb,$5,$6) RETURNING id`, [user?.id ?? null, biz?.id ?? null, t, JSON.stringify(answers), s, ASSESSMENT_VERSION]);
  (await cookies()).set(DRAFT_COOKIE, t, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 90 });
  await track('assessment_started', user?.id);
  return row!.id as string;
}

export async function claimDraft(userId: string) {
  const t = (await cookies()).get(DRAFT_COOKIE)?.value;
  if (!t) return;
  await q(`UPDATE assessments SET user_id = $1 WHERE draft_token = $2 AND user_id IS NULL`, [userId, t]);
}

export async function ensureBusiness(user: User, answers: Answers) {
  let b = await one(`SELECT * FROM businesses WHERE owner_id = $1 ORDER BY created_at LIMIT 1`, [user.id]);
  const s = compute(answers, DEFAULT_WEIGHTS);
  const L = s.labels;
  if (!b) {
    b = await one(`INSERT INTO businesses (owner_id, industry, revenue_band, employees_band, years_band) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [user.id, L.industry, L.revenue, L.employees, L.years]);
    await audit({ actorId: user.id, businessId: b!.id, action: 'Business profile created', kind: 'Profile' });
  } else {
    await q(`UPDATE businesses SET industry = $2, revenue_band = $3, employees_band = $4, years_band = $5, updated_at = now() WHERE id = $1`, [b.id, L.industry, L.revenue, L.employees, L.years]);
  }
  return b!;
}

export async function finishAssessment(user: User) {
  const d = await getDraft(user);
  if (!d) return null;
  const answers = sanitiseAnswers(d.answers);
  const biz = await ensureBusiness(user, answers);
  const { version, weights } = await activeWeights();
  const s = compute(answers, weights);
  const score = await one(`INSERT INTO scores (assessment_id, business_id, transferability, readiness, independence, dependency, components, value_low, value_high, revenue_mid, profit, data_quality, inputs, labels, score_version, assessment_version, calc_version)
    VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15,$16,$17) RETURNING *`,
    [d.id, biz.id, s.t, s.r, s.ind, s.dep, JSON.stringify(s.components), s.value?.[0] ?? null, s.value?.[1] ?? null, s.revenue, s.profit, s.quality, JSON.stringify(answers), JSON.stringify(s.labels), version, d.assessment_version, CALC_VERSION]);
  const narrative = await aiNarrative(toStored(score));
  if (narrative) await q(`UPDATE scores SET narrative = $2, narrative_source = $3 WHERE id = $1`, [score!.id, narrative, process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5']);
  await q(`UPDATE assessments SET status = 'complete', completed_at = now(), user_id = $2, business_id = $3, draft_token = NULL WHERE id = $1`, [d.id, user.id, biz.id]);
  (await cookies()).delete(DRAFT_COOKIE);
  // Add readiness tasks that are not already on the plan.
  const existing = new Set((await q(`SELECT task_key FROM tasks WHERE business_id = $1`, [biz.id])).map((r) => r.task_key));
  const plan = generateTasks(score as unknown as StoredScore);
  for (const t of plan) {
    if (existing.has(t.key)) continue;
    await q(`INSERT INTO tasks (business_id, task_key, title, category, priority, effort, impact, why, criteria, assignee, due_date, sort) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, (now() + ($11 || ' days')::interval)::date, $12)`,
      [biz.id, t.key, t.title, t.category, t.priority, t.effort, t.impact, t.why, t.criteria, t.assignee, String(t.days), t.sort]);
  }
  const invite = (await cookies()).get('lh_invite')?.value;
  if (invite) {
    const link = await one(`UPDATE advisor_links SET business_id = $2, status = 'active' WHERE token = $1 AND direction = 'advisor_invited' AND business_id IS NULL RETURNING advisor_user_id`, [invite, biz.id]);
    if (link) await audit({ actorId: user.id, businessId: biz.id, action: 'Shared scores, tasks and documents (view) with the advisor who invited you', kind: 'Permission' });
    (await cookies()).delete('lh_invite');
  }
  await audit({ actorId: user.id, businessId: biz.id, action: `Assessment completed · ${version}`, kind: 'Assessment', detail: { scoreId: score!.id } });
  await track('assessment_completed', user.id, { t: s.t, r: s.r, ind: s.ind });
  await track('report_generated', user.id);
  return { business: biz, score };
}

export async function ownerContext(user: User) {
  const business = await one(`SELECT * FROM businesses WHERE owner_id = $1 ORDER BY created_at LIMIT 1`, [user.id]);
  if (!business) return { business: null, score: null, history: [], paid: false };
  const history = await q(`SELECT * FROM scores WHERE business_id = $1 ORDER BY created_at DESC`, [business.id]);
  const paid = REPORT_FREE || !!(await one(`SELECT 1 FROM payments WHERE business_id = $1 AND item LIKE 'Detailed Report%' AND status = 'paid'`, [business.id]));
  return { business, score: history[0] ?? null, history, paid };
}

export function toStored(row: any): StoredScore {
  return { ...row, value_low: row.value_low == null ? null : Number(row.value_low), value_high: row.value_high == null ? null : Number(row.value_high), revenue_mid: Number(row.revenue_mid), profit: Number(row.profit) };
}

/** Business ids this user can see as an advisor (active link). */
export async function advisorBusinessIds(userId: string) {
  return (await q(`SELECT business_id FROM advisor_links WHERE advisor_user_id = $1 AND status = 'active' AND business_id IS NOT NULL`, [userId])).map((r) => r.business_id as string);
}
