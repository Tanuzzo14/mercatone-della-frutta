/**
 * POST /api/auth/verify-otp
 * Body: { businessId: string, otp: string }
 *
 * Verifies the OTP stored in D1. Returns 401 if the code is wrong or expired.
 */

const VALID_BUSINESS_IDS = ['mercatone'];

export async function onRequestPost({ request, env }) {
  try {
    const { businessId, otp } = await request.json();

    if (!businessId || !otp) {
      return Response.json({ error: 'businessId e otp sono obbligatori' }, { status: 400 });
    }

    if (!VALID_BUSINESS_IDS.includes(businessId)) {
      return Response.json({ error: 'Business non valido' }, { status: 400 });
    }

    const now = Date.now();

    const row = await env.DB.prepare(
      'SELECT id FROM otp_codes WHERE business_id = ? AND code = ? AND used = 0 AND expires_at > ?'
    )
      .bind(businessId, otp, now)
      .first();

    if (!row) {
      return Response.json({ success: false, error: 'OTP non valido o scaduto' }, { status: 401 });
    }

    // Mark OTP as consumed so it cannot be reused
    await env.DB.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?')
      .bind(row.id)
      .run();

    return Response.json({ success: true, businessId });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
