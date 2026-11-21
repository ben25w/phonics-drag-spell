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

    const audio = await listAudio(context.env);

    const words = results.map(row => ({
      ...row,
      image_url: imageUrl(context.env, row.image_url),
      audio_url: audio[row.word] ? audio[row.word].url : '',
      audio_source: audio[row.word] ? audio[row.word].source : ''
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

// Recorded or generated word audio lives in the same R2 bucket under audio/<word>.<ext>.
// Returns { word: { url, source } } where source is 'teacher' or 'ai'.
async function listAudio(env) {
  const bucket = env.PHONICS_IMAGES || env.R2_PUBLIC_URL;
  if (!bucket || typeof bucket.list !== 'function') return {};
  try {
    const listed = await bucket.list({ prefix: 'audio/', limit: 1000, include: ['customMetadata'] });
    const out = {};
    for (const obj of listed.objects) {
      const m = /^audio\/([a-z]+)\.[a-z0-9]+$/.exec(obj.key);
      if (!m) continue;
      out[m[1]] = {
        url: `/api/audio/${encodeURIComponent(obj.key.slice(6))}?v=${obj.uploaded.getTime()}`,
        source: (obj.customMetadata && obj.customMetadata.source) || 'teacher'
      };
    }
    return out;
  } catch {
    return {};
  }
}
