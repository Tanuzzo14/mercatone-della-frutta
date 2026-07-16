/**
 * POST /api/auth/send-otp
 * Body: { businessId: string }
 *
 * Generates a 6-digit OTP, stores it in D1 with a 60-second expiry,
 * then sends the code via TextBelt to PHONE_NUMBER_1.
 *
 * Required environment variables (set in Cloudflare Pages dashboard):
 *   PHONE_NUMBER_1   – recipient phone number
 *   TEXTBELT_URL     – (optional) TextBelt endpoint (defaults to https://textbelt.com/text)
 *   TEXTBELT_KEY     – (optional) API key (defaults to the free "textbelt" key)
 */

const VALID_BUSINESS_IDS = ['pennino', 'mercatone'];

export async function onRequestPost({ request, env }) {
  try {
    const { businessId } = await request.json();

    if (!VALID_BUSINESS_IDS.includes(businessId)) {
      return Response.json({ error: 'Business non valido' }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const id = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + 60 * 1000; // 60 seconds

    // Remove old/expired OTPs for this business before inserting a new one
    await env.DB.prepare(
      'DELETE FROM otp_codes WHERE business_id = ? OR expires_at < ?'
    )
      .bind(businessId, now)
      .run();

    await env.DB.prepare(
      'INSERT INTO otp_codes (id, business_id, code, expires_at, used) VALUES (?, ?, ?, ?, 0)'
    )
      .bind(id, businessId, otp, expiresAt)
      .run();

    const message = `ecco il codice per entrare su mercatone della frutta: ${otp}`;
    const textbeltUrl = env.TEXTBELT_URL || 'https://textbelt.com/text';
    const phone = env.PHONE_NUMBER_1;
    const key = env.TEXTBELT_KEY || 'textbelt';

    if (phone) {
      const body = new URLSearchParams({ phone, message, key });
      const response = await fetch(textbeltUrl, { method: 'POST', body });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Errore nell'invio dell'OTP");
      }
    } else {
      console.warn('[OTP] PHONE_NUMBER_1 non configurato – OTP:', otp);
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
