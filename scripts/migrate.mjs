// Applies db/schema.sql and seeds reference data. Runs before `next build`.
// Skips (without failing the build) when DATABASE_URL is not set.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { seed } from '../db/seed.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

if (!url) {
  console.warn('[migrate] DATABASE_URL not set — skipping migrations. Connect Neon in Vercel → Storage.');
  process.exit(0);
}

const statements = readFileSync(path.join(root, 'db/schema.sql'), 'utf8')
  .split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
  .split(';').map((s) => s.trim()).filter(Boolean);

let run, close = async () => {};
if (url.startsWith('pglite:')) {
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite(url.slice('pglite:'.length));
  run = async (q, p = []) => (await db.query(q, p)).rows;
  close = () => db.close();
} else {
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(url);
  run = async (q, p = []) => await sql.query(q, p);
}

try {
  for (const s of statements) await run(s);
  await seed(run);
  console.log(`[migrate] ${statements.length} statements applied, seed ok`);
} catch (e) {
  console.error('[migrate] failed:', e.message);
  process.exit(1);
} finally {
  await close();
}
