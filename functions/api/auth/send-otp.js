const VALID_BUSINESS_IDS = ['mercatone'];

export async function onRequestPost({ request, env }) {
  try {
    const { businessId } = await request.json();

    if (!VALID_BUSINESS_IDS.includes(businessId)) {
      return Response.json({ error: 'Business non valido' }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const id = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + 60 * 1000; // 60 secondi

    // FIX LOGICA: Rimosso il "OR" pericoloso. Prima cancellavi TUTTI gli OTP del business, 
    // inclusi quelli ancora validi generati un secondo prima da altri utenti!
    await env.DB.prepare(
      'DELETE FROM otp_codes WHERE (business_id = ? AND used = 1) OR expires_at < ?'
    )
      .bind(businessId, now)
      .run();

    await env.DB.prepare(
      'INSERT INTO otp_codes (id, business_id, code, expires_at, used) VALUES (?, ?, ?, ?, 0)'
    )
      .bind(id, businessId, otp, expiresAt)
      .run();

    const message = `Ecco il codice per entrare su mercatone della frutta: ${otp}`;
    const textbeltUrl = env.TEXTBELT_URL || 'https://textbelt.com/text';
    const phone = env.PHONE_NUMBER_1; // Assicurati che nel pannello Cloudflare sia "+393331234567"
    const key = env.TEXTBELT_KEY || 'textbelt';

    if (phone) {
      // Usiamo JSON che è più pulito e gestisce il "+" nativamente senza sorprese
      const response = await fetch(textbeltUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message, key })
      });

      // CORRETTO: Cambiato PHONE_NUMBER_1 in phone per evitare il crash del Worker
      console.warn(`[OTP] Inviato SMS a ${phone}. (OTP di test: ${otp})`);
      
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
