import 'server-only';
import { q, one } from '@/lib/db';

const SCOPE_LABEL: Record<string, string> = { scores: 'scores', tasks: 'tasks', documents: 'documents (view)' };
export const scopeOf = (l: any): string[] => (Array.isArray(l?.scope) ? l.scope : []);
export function sharedText(scope: string[]) {
  const on = Object.keys(SCOPE_LABEL).filter((k) => scope.includes(k)).map((k) => SCOPE_LABEL[k]);
  const off = Object.keys(SCOPE_LABEL).filter((k) => !scope.includes(k)).map((k) => SCOPE_LABEL[k]);
  return `Shared with you: ${on.length ? on.join(', ') : 'nothing yet'}. Not shared: ${[...off, 'report narrative', 'valuation', 'deal terms'].join(', ')}.`;
}

export async function ClientDocs({ businessId, userId }: { businessId: string; userId: string }) {
  // Re-check the link and scope here so this list never renders for a client who has not shared documents.
  const ok = await one(`SELECT 1 FROM advisor_links WHERE advisor_user_id = $1 AND business_id = $2 AND status = 'active' AND scope ? 'documents'`, [userId, businessId]);
  if (!ok) return null;
  const docs = await q(`SELECT DISTINCT ON (category, name) id, category, name, ext, version FROM documents WHERE business_id = $1 ORDER BY category, name, version DESC`, [businessId]);
  return (
    <div className="col gap6 rule-tl" style={{ paddingTop: 12 }}>
      <span className="eyebrow">Documents (view only)</span>
      {docs.length === 0 && <span className="small muted">Nothing uploaded yet.</span>}
      {docs.map((d) => <a key={d.id} href={'/api/documents/' + d.id} target="_blank" rel="noopener" className="small">{d.category} › {d.name} v{d.version}</a>)}
    </div>
  );
}

