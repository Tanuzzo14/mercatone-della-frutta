/**
 * GET  /api/accounting  — restituisce tutte le registrazioni contabili
 * POST /api/accounting  — crea una nuova registrazione contabile
 */

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM accounting ORDER BY mese DESC, data DESC'
    ).all();
    return Response.json(results);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function onRequestPost({ env, request }) {
  try {
    const { mese, data, descrizione, entrate, uscite } = await request.json();
    if (!mese || !data || !descrizione) {
      return Response.json({ error: 'Campi obbligatori mancanti: mese, data, descrizione' }, { status: 400 });
    }
    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO accounting (id, mese, data, descrizione, entrate, uscite) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, mese, data, descrizione, entrate ?? 0, uscite ?? 0).run();
    return Response.json({ id, mese, data, descrizione, entrate: entrate ?? 0, uscite: uscite ?? 0 }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
