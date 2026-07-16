/**
 * GET  /api/products  — restituisce tutti i prodotti
 * POST /api/products  — crea un nuovo prodotto
 */

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM products ORDER BY mese DESC, articolo ASC'
    ).all();
    return Response.json(results);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function onRequestPost({ env, request }) {
  try {
    const { mese, articolo, quantita, prezzoKg } = await request.json();
    if (!mese || !articolo || prezzoKg == null) {
      return Response.json({ error: 'Campi obbligatori mancanti: mese, articolo, prezzoKg' }, { status: 400 });
    }
    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO products (id, mese, articolo, quantita, prezzoKg) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, mese, articolo, quantita ?? 0, prezzoKg).run();
    return Response.json({ id, mese, articolo, quantita: quantita ?? 0, prezzoKg }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
