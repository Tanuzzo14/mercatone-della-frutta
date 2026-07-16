/**
 * DELETE /api/accounting/:id  — elimina una registrazione contabile per ID
 */

export async function onRequestDelete({ env, params }) {
  try {
    await env.DB.prepare('DELETE FROM accounting WHERE id = ?').bind(params.id).run();
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
