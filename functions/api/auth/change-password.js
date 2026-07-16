import { ensurePasswordStore, sha256Hex, MERCATONE_BUSINESS_ID } from './_password-utils';

export async function onRequestPost({ request, env }) {
  try {
    const { businessId, oldPassword, newPassword } = await request.json();

    if (businessId !== MERCATONE_BUSINESS_ID) {
      return Response.json({ error: 'Business non valido' }, { status: 400 });
    }

    if (typeof oldPassword !== 'string' || typeof newPassword !== 'string') {
      return Response.json({ error: 'oldPassword e newPassword sono obbligatorie' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return Response.json({ error: 'La nuova password deve contenere almeno 8 caratteri' }, { status: 400 });
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

    const oldPasswordHash = await sha256Hex(oldPassword);
    if (oldPasswordHash !== row.password_hash) {
      return Response.json({ success: false, error: 'Vecchia password non valida' }, { status: 401 });
    }

    const newPasswordHash = await sha256Hex(newPassword);
    await env.DB.prepare(
      'UPDATE auth_passwords SET password_hash = ?, updated_at = ? WHERE business_id = ?'
    )
      .bind(newPasswordHash, Date.now(), businessId)
      .run();

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
