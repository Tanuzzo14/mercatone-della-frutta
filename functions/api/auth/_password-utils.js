export const MERCATONE_BUSINESS_ID = 'mercatone';
export const DEFAULT_MERCATONE_PASSWORD = 'Mercatone2025!';

export async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function ensurePasswordStore(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS auth_passwords (
      business_id TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`
  ).run();

  const defaultHash = await sha256Hex(DEFAULT_MERCATONE_PASSWORD);
  await env.DB.prepare(
    'INSERT OR IGNORE INTO auth_passwords (business_id, password_hash, updated_at) VALUES (?, ?, ?)'
  )
    .bind(MERCATONE_BUSINESS_ID, defaultHash, Date.now())
    .run();
}
