// Word audio. GET is public (the game plays it). PUT and DELETE need the
// ADMIN_PASSCODE secret in an X-Passcode header.
//
//   GET    /api/audio/sat.webm        stream the clip
//   PUT    /api/audio/sat?source=ai   upload (body = audio; source defaults to teacher)
//   DELETE /api/audio/sat             remove every clip for the word

const EXT_BY_TYPE = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav'
};
const TYPE_BY_EXT = { webm: 'audio/webm', ogg: 'audio/ogg', m4a: 'audio/mp4', mp3: 'audio/mpeg', wav: 'audio/wav' };
const MAX_BYTES = 3 * 1024 * 1024;

function bucketOf(env) {
  // On the live site the bucket binding is called R2_PUBLIC_URL.
  const b = env.PHONICS_IMAGES || env.R2_PUBLIC_URL;
  return b && typeof b.get === 'function' ? b : null;
}

async function digest(text) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

// Returns a Response when the request is not allowed, otherwise null.
export async function checkPasscode(context) {
  const secret = context.env.ADMIN_PASSCODE;
  if (!secret) {
    return Response.json({ error: 'ADMIN_PASSCODE is not set for this site' }, { status: 503 });
  }
  const given = context.request.headers.get('X-Passcode') || '';
  const [a, b] = await Promise.all([digest(given), digest(secret)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff !== 0) return Response.json({ error: 'Wrong passcode' }, { status: 401 });
  return null;
}

async function keysForWord(bucket, word) {
  const listed = await bucket.list({ prefix: `audio/${word}.`, include: ['customMetadata'] });
  return listed.objects;
}

export async function onRequestGet(context) {
  const bucket = bucketOf(context.env);
  const key = context.params.key;
  if (!bucket) return Response.json({ error: 'R2 binding missing' }, { status: 500 });
  if (!/^[a-z]{1,12}\.(webm|ogg|m4a|mp3|wav)$/.test(key)) return new Response('Not found', { status: 404 });

  const object = await bucket.get(`audio/${key}`);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  if (!headers.has('content-type')) headers.set('content-type', TYPE_BY_EXT[key.split('.')[1]]);
  headers.set('etag', object.httpEtag);
  // The game asks for ?v=<upload time>, so a new recording gets a new URL.
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}

export async function onRequestPut(context) {
  const denied = await checkPasscode(context);
  if (denied) return denied;
  const bucket = bucketOf(context.env);
  if (!bucket) return Response.json({ error: 'R2 binding missing' }, { status: 500 });

  const word = context.params.key.split('.')[0];
  if (!/^[a-z]{1,12}$/.test(word)) return Response.json({ error: 'Bad word' }, { status: 400 });

  // Only words that exist in the game can have audio.
  const db = context.env.DB || context.env['phonics-db'];
  if (db) {
    const row = await db.prepare('SELECT 1 AS ok FROM words WHERE word = ? LIMIT 1').bind(word).first();
    if (!row) return Response.json({ error: 'Unknown word' }, { status: 404 });
  }

  const type = (context.request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const ext = EXT_BY_TYPE[type];
  if (!ext) return Response.json({ error: `Unsupported audio type: ${type || 'none'}` }, { status: 415 });

  const body = await context.request.arrayBuffer();
  if (body.byteLength === 0) return Response.json({ error: 'Empty recording' }, { status: 400 });
  if (body.byteLength > MAX_BYTES) return Response.json({ error: 'Recording too large' }, { status: 413 });

  const url = new URL(context.request.url);
  const source = url.searchParams.get('source') === 'ai' ? 'ai' : 'teacher';

  const existing = await keysForWord(bucket, word);
  const hasTeacher = existing.some(o => o.customMetadata && o.customMetadata.source === 'teacher');
  if (source === 'ai' && hasTeacher) {
    return Response.json({ error: 'A teacher recording already exists' }, { status: 409 });
  }

  const newKey = `audio/${word}.${ext}`;
  await bucket.put(newKey, body, {
    httpMetadata: { contentType: TYPE_BY_EXT[ext] },
    customMetadata: { source, recorded: new Date().toISOString() }
  });
  // Remove clips in other formats so only one clip per word remains.
  const stale = existing.map(o => o.key).filter(k => k !== newKey);
  if (stale.length) await bucket.delete(stale);

  return Response.json({ ok: true, word, source });
}

export async function onRequestDelete(context) {
  const denied = await checkPasscode(context);
  if (denied) return denied;
  const bucket = bucketOf(context.env);
  if (!bucket) return Response.json({ error: 'R2 binding missing' }, { status: 500 });

  const word = context.params.key.split('.')[0];
  if (!/^[a-z]{1,12}$/.test(word)) return Response.json({ error: 'Bad word' }, { status: 400 });

  const existing = await keysForWord(bucket, word);
  if (existing.length) await bucket.delete(existing.map(o => o.key));
  return Response.json({ ok: true, word, removed: existing.length });
}
