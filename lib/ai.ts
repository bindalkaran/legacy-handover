import 'server-only';
import { TIPS, weakest, strongest, type StoredScore } from './report';

/** Optional AI-written interpretation. Never changes numbers; falls back silently (PRD §93). */
export async function aiNarrative(s: StoredScore): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const facts = {
    labels: s.labels, transferability: s.transferability, readiness: s.readiness, independence: s.independence,
    strongest: strongest(s).map((c) => `${c.k} ${c.s}`), weakest: weakest(s).map((k) => `${k} (${TIPS[k]})`)
  };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: ctrl.signal,
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 400,
        system: 'You write a calm, respectful 3-4 sentence interpretation of a business succession assessment for an Indian business owner. Use only the facts given. Never invent numbers, never change scores, never recommend selling. Neutral language: "plan your next chapter", not "exit". Plain prose, no lists, no headings, no em dashes.',
        messages: [{ role: 'user', content: 'Facts (owner-supplied answers and deterministic scores):\n' + JSON.stringify(facts) }]
      })
    });
    if (!r.ok) return null;
    const j = await r.json();
    const text = (j.content || []).map((c: any) => c.text || '').join('').trim();
    return text.length > 40 ? text.slice(0, 1200) : null;
  } catch { return null; } finally { clearTimeout(t); }
}
