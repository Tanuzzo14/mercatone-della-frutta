/**
 * POST /api/auth/send-otp
 * Body: { businessId: string }
 *
 * Generates a 6-digit OTP, stores it in D1 with a 60-second expiry,
 * then sends the code via TextBelt to PHONE_NUMBER_1 and PHONE_NUMBER_2.
 *
 * Required environment variables (set in Cloudflare Pages dashboard):
 *   PHONE_NUMBER_1   – first recipient phone number
 *   PHONE_NUMBER_2   – second recipient phone number
 *   TEXTBELT_URL     – TextBelt server endpoint (e.g. http://your-server/text)
 *   TEXTBELT_KEY     – (optional) API key for textbelt.com paid version
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
    const textbeltUrl = env.TEXTBELT_URL;
    const phones = [env.PHONE_NUMBER_1, env.PHONE_NUMBER_2].filter(Boolean);

    if (textbeltUrl && phones.length > 0) {
      await Promise.all(
        phones.map((number) => {
          const body = new URLSearchParams({ number, message });
          if (env.TEXTBELT_KEY) {
            body.set('key', env.TEXTBELT_KEY);
          }
          return fetch(textbeltUrl, { method: 'POST', body });
        })
      );
    } else {
      console.warn('[OTP] TEXTBELT_URL o PHONE_NUMBER_* non configurati – OTP:', otp);
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
