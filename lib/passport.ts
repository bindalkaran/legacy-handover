import 'server-only';
import { q, one } from './db';
import { DOC_TARGETS } from './constants';

export const SECTIONS = ['Identity', 'Financial profile', 'Scores', 'Valuation history', 'Documents', 'Transition status'];

export async function passportData(businessId: string) {
  const b = await one(`SELECT b.*, u.name AS owner_name FROM businesses b JOIN users u ON u.id = b.owner_id WHERE b.id = $1`, [businessId]);
  if (!b) return null;
  const history = await q(`SELECT transferability, readiness, independence, value_low, value_high, revenue_mid, profit, labels, score_version, created_at FROM scores WHERE business_id = $1 ORDER BY created_at`, [businessId]);
  const docs = await q(`SELECT category, count(DISTINCT name)::int AS n FROM documents WHERE business_id = $1 GROUP BY category`, [businessId]);
  const tasks = await one(`SELECT count(*)::int AS total, count(*) FILTER (WHERE status = 'done')::int AS done FROM tasks WHERE business_id = $1`, [businessId]);
  const deal = await one(`SELECT d.*, u.name AS buyer_name FROM deals d JOIN users u ON u.id = d.buyer_id WHERE d.business_id = $1 ORDER BY d.created_at DESC LIMIT 1`, [businessId]);
  const offer = deal ? await one(`SELECT * FROM offers WHERE deal_id = $1 AND status = 'Accepted' ORDER BY created_at DESC LIMIT 1`, [deal.id]) : null;
  const timeline = await q(`SELECT action, created_at FROM audit_logs WHERE business_id = $1 AND kind IN ('Assessment','Profile','NDA','Closing','System','Stage') ORDER BY created_at LIMIT 40`, [businessId]);
  const latest = history[history.length - 1];
  const docTotal = docs.reduce((a, d) => a + d.n, 0);
  const tr = deal?.transition || {};
  const trDone = Object.values(tr).filter(Boolean).length;
  return { b, history, latest, docs, docTotal, docTarget: Object.values(DOC_TARGETS).reduce((a, n) => a + n, 0), tasks, deal, offer, timeline, trDone };
}
