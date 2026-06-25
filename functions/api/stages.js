export async function onRequestGet(context) {
  const db = context.env.DB;

  try {
    const { results } = await db
      .prepare('SELECT * FROM stages ORDER BY stage ASC')
      .all();

    return Response.json({ stages: results });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
