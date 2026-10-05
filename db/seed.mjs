// Idempotent reference data (score weights, config).

export const DEFAULT_WEIGHTS = {
  'Financial quality': 20,
  'Management depth': 15,
  'Owner independence': 15,
  'Customer concentration': 10,
  'Documentation': 10,
  'Operations': 10,
  'Legal readiness': 10,
  'Revenue quality': 5,
  'Employee stability': 5
};

export async function seed(run) {
  await run(`INSERT INTO score_versions (version, weights, created_by) VALUES ($1, $2::jsonb, 'system') ON CONFLICT (version) DO NOTHING`, ['score-v1.0', JSON.stringify(DEFAULT_WEIGHTS)]);
  await run(`INSERT INTO app_config (key, value) VALUES ('active_score_version', '"score-v1.0"'::jsonb) ON CONFLICT (key) DO NOTHING`, []);
  // Invented sample listings and professionals were removed before launch: they carried
  // made-up ratings and verification badges. Delete any left from earlier seeds.
  await run(`DELETE FROM listings WHERE is_sample = true`, []);
  await run(`DELETE FROM professionals WHERE is_sample = true`, []);
  await run(`INSERT INTO app_config (key, value) VALUES ('show_samples', 'false'::jsonb) ON CONFLICT (key) DO UPDATE SET value = 'false'::jsonb`, []);
}
