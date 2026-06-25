export async function onRequestGet(context) {
  const bucket = context.env.PHONICS_IMAGES || context.env.R2_PUBLIC_URL;
  const key = context.params.key;

  if (!bucket || typeof bucket.get !== 'function') {
    return Response.json(
      { error: 'R2 binding missing: expected PHONICS_IMAGES or R2_PUBLIC_URL bucket binding' },
      { status: 500 }
    );
  }

  const object = await bucket.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  if (!headers.has('content-type')) headers.set('content-type', 'image/jpeg');
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
}
