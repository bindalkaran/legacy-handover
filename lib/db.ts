import 'server-only';
import { readFileSync } from 'node:fs';
import path from 'node:path';

type Row = Record<string, any>;
type Runner = (text: string, params?: unknown[]) => Promise<Row[]>;

const g = globalThis as unknown as { __lhRun?: Runner; __lhSchema?: Promise<void> };

export function dbUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
}

export function dbConfigured() {
  return !!dbUrl();
}

async function makeRunner(): Promise<Runner> {
  const url = dbUrl();
  if (!url) throw new DbNotConfigured();
  if (url.startsWith('pglite:')) {
    const mod = '@electric-sql/pglite';
    const { PGlite } = await import(/* webpackIgnore: true */ mod);
    const db = new PGlite(url.slice('pglite:'.length));
    return async (q, p = []) => (await db.query(q, p as any[])).rows as Row[];
  }
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(url);
  return async (q, p = []) => (await sql.query(q, p as any[])) as Row[];
}

export class DbNotConfigured extends Error {
  constructor() { super('DATABASE_URL is not configured'); }
}

async function ensureSchema(run: Runner) {
  // Cheap check: if the core table exists, assume migrations ran at build.
  const r = await run(`SELECT to_regclass('public.app_config') AS t`);
  if (r[0]?.t) return;
  const file = path.join(process.cwd(), 'db/schema.sql');
  const statements = readFileSync(file, 'utf8')
    .split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
    .split(';').map((s) => s.trim()).filter(Boolean);
  for (const s of statements) await run(s);
  const { seed } = await import('@/db/seed.mjs');
  await seed((q: string, p: unknown[]) => run(q, p));
}

async function runner(): Promise<Runner> {
  if (!g.__lhRun) {
    const r = await makeRunner();
    g.__lhRun = r;
  }
  if (!g.__lhSchema) g.__lhSchema = ensureSchema(g.__lhRun).catch((e) => { g.__lhSchema = undefined; throw e; });
  await g.__lhSchema;
  return g.__lhRun;
}

export async function q<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  const run = await runner();
  return (await run(text, params)) as T[];
}

export async function one<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}

export async function audit(e: { actorId?: string | null; actorLabel?: string; businessId?: string | null; dealId?: string | null; action: string; kind?: string; detail?: unknown }) {
  try {
    await q(`INSERT INTO audit_logs (actor_id, actor_label, business_id, deal_id, action, kind, detail) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [e.actorId ?? null, e.actorLabel ?? null, e.businessId ?? null, e.dealId ?? null, e.action, e.kind ?? null, e.detail ? JSON.stringify(e.detail) : null]);
  } catch { /* audit must never break the request */ }
}

export async function track(name: string, userId?: string | null, props?: unknown) {
  try {
    await q(`INSERT INTO analytics_events (name, user_id, props) VALUES ($1,$2,$3)`, [name, userId ?? null, props ? JSON.stringify(props) : null]);
  } catch { /* best effort */ }
}

export async function config<T = unknown>(key: string, fallback: T): Promise<T> {
  const r = await one(`SELECT value FROM app_config WHERE key = $1`, [key]);
  return r ? (r.value as T) : fallback;
}

export async function setConfig(key: string, value: unknown) {
  await q(`INSERT INTO app_config (key, value, updated_at) VALUES ($1, $2::jsonb, now()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`, [key, JSON.stringify(value)]);
}
