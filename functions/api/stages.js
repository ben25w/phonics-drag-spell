export async function onRequestGet(context) {
  const db = context.env.DB || context.env['phonics-db'];

  try {
    if (!db) throw new Error('D1 binding missing: expected DB or phonics-db');

    const { results } = await db
      .prepare('SELECT * FROM stages ORDER BY stage ASC')
      .all();

    return Response.json({ stages: results });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
