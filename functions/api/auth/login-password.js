import { ensurePasswordStore, sha256Hex, MERCATONE_BUSINESS_ID } from './_password-utils';

export async function onRequestPost({ request, env }) {
  try {
    const { businessId, password } = await request.json();

    if (businessId !== MERCATONE_BUSINESS_ID) {
      return Response.json({ error: 'Business non valido' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length === 0) {
      return Response.json({ error: 'password obbligatoria' }, { status: 400 });
    }

    await ensurePasswordStore(env);

    const row = await env.DB.prepare(
      'SELECT password_hash FROM auth_passwords WHERE business_id = ?'
    )
      .bind(businessId)
      .first();

    if (!row) {
      return Response.json({ success: false, error: 'Credenziali non valide' }, { status: 401 });
    }

    const passwordHash = await sha256Hex(password);
    if (passwordHash !== row.password_hash) {
      return Response.json({ success: false, error: 'Credenziali non valide' }, { status: 401 });
    }

    return Response.json({ success: true, businessId });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
