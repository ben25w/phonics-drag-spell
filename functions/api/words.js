export async function onRequestGet(context) {
  const url   = new URL(context.request.url);
  const stage = parseInt(url.searchParams.get('stage') || '1');
  const db    = context.env.DB;
  const r2    = context.env.R2_PUBLIC_URL || '';

  try {
    const { results } = await db
      .prepare('SELECT * FROM words WHERE stage <= ? ORDER BY RANDOM()')
      .bind(stage)
      .all();

    const words = results.map(row => ({
      ...row,
      image_url: row.image_url ? `${r2}/${row.image_url}` : ''
    }));

    return Response.json({ words });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
