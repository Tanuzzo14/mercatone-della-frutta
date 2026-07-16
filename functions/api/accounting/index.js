/**
 * GET  /api/accounting  — restituisce tutte le registrazioni Pennino
 * POST /api/accounting  — crea una nuova registrazione
 * Colonne: FATT ACQ | data | denom | vendite | data vend | deno vend
 */

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM accounting ORDER BY mese DESC, rowid ASC'
    ).all();
    return Response.json(results);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function onRequestPost({ env, request }) {
  try {
    const { mese, fattAcq, dataAcq, denom, vendite, dataVend, denomVend } = await request.json();
    if (!mese) {
      return Response.json({ error: 'Campo obbligatorio mancante: mese' }, { status: 400 });
    }
    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO accounting (id, mese, fattAcq, dataAcq, denom, vendite, dataVend, denomVend) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, mese, fattAcq ?? 0, dataAcq ?? '', denom ?? '', vendite ?? 0, dataVend ?? '', denomVend ?? '').run();
    return Response.json(
      { id, mese, fattAcq: fattAcq ?? 0, dataAcq: dataAcq ?? '', denom: denom ?? '', vendite: vendite ?? 0, dataVend: dataVend ?? '', denomVend: denomVend ?? '' },
      { status: 201 }
    );
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
