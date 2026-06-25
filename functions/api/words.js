export async function onRequestGet(context) {
  const url   = new URL(context.request.url);
  const stage = parseInt(url.searchParams.get('stage') || '1');
  const db    = context.env.DB || context.env['phonics-db'];

  try {
    if (!db) throw new Error('D1 binding missing: expected DB or phonics-db');

    const { results } = await db
      .prepare('SELECT * FROM words WHERE stage <= ? ORDER BY RANDOM()')
      .bind(stage)
      .all();

    const words = results.map(row => ({
      ...row,
      image_url: imageUrl(context.env, row.image_url)
    }));

    return Response.json({ words });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

function imageUrl(env, filename) {
  if (!filename) return '';

  const imageSource = env.R2_PUBLIC_URL || env.PHONICS_IMAGES_BASE_URL || '';

  if (typeof imageSource === 'string' && imageSource.trim()) {
    return `${imageSource.replace(/\/$/, '')}/${filename}`;
  }

  if (imageSource && typeof imageSource.get === 'function') {
    return `/api/images/${encodeURIComponent(filename)}`;
  }

  return '';
}
