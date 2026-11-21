const http = require('http');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const port = 3456;

const mime = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.jpg':  'image/jpeg',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ttf':  'font/ttf',
  '.woff2': 'font/woff2',
};

// Local dev only: serve /api/stages and /api/words from seed.sql so the
// real 14 stages and 131 words can be tried without Cloudflare.
function seedData() {
  const sql = fs.readFileSync(path.join(dir, 'seed.sql'), 'utf8');
  const stages = [...sql.matchAll(/INSERT INTO stages VALUES \((\d+),\s*'([^']*)',\s*'([^']*)'\)/g)]
    .map(m => ({ stage: +m[1], label: m[2], letters: m[3] }));
  const words = [...sql.matchAll(/INSERT INTO words \(word, image_url, stage\) VALUES \('([^']*)',\s*'([^']*)',\s*(\d+)\)/g)]
    .map((m, i) => ({ id: i + 1, word: m[1], image_url: m[2] ? '/images/' + m[2] : '', stage: +m[3] }));
  return { stages, words };
}

// Local dev only: in-memory stand-in for the audio API (passcode: "test").
const audioStore = {}; // word -> { type, buf, source, v }
function readBody(req) {
  return new Promise(r => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => r(Buffer.concat(c))); });
}
const EXTS = { 'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/wav': 'wav' };

async function audioApi(req, res) {
  const json = (code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/api/audio-check' || req.method !== 'GET') {
    if (req.headers['x-passcode'] !== 'test') return json(401, { error: 'Wrong passcode' });
  }
  if (u.pathname === '/api/audio-check') return json(200, { ok: true });
  const key = decodeURIComponent(u.pathname.replace('/api/audio/', ''));
  const word = key.split('.')[0];
  if (req.method === 'GET') {
    const a = audioStore[word];
    if (!a) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': a.type }); return res.end(a.buf);
  }
  if (req.method === 'PUT') {
    const type = (req.headers['content-type'] || '').split(';')[0];
    if (!EXTS[type]) return json(415, { error: 'Unsupported audio type: ' + type });
    const source = u.searchParams.get('source') === 'ai' ? 'ai' : 'teacher';
    if (source === 'ai' && audioStore[word] && audioStore[word].source === 'teacher') return json(409, { error: 'A teacher recording already exists' });
    audioStore[word] = { type, buf: await readBody(req), source, v: Date.now(), ext: EXTS[type] };
    return json(200, { ok: true, word, source });
  }
  if (req.method === 'DELETE') { delete audioStore[word]; return json(200, { ok: true }); }
  json(405, { error: 'Method not allowed' });
}

http.createServer((req, res) => {
  if (req.url.startsWith('/api/audio')) { audioApi(req, res); return; }
  if (req.url.startsWith('/api/')) {
    const { stages, words } = seedData();
    const stage = +(new URL(req.url, 'http://x').searchParams.get('stage') || 1);
    const body = req.url.startsWith('/api/stages')
      ? { stages }
      : { words: words.filter(w => w.stage <= stage).map(w => {
          const a = audioStore[w.word];
          return { ...w, audio_url: a ? `/api/audio/${w.word}.${a.ext}?v=${a.v}` : '', audio_source: a ? a.source : '' };
        }) };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
    return;
  }
  let filePath = path.join(dir, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
    res.end(data);
  });
}).listen(port, () => console.log(`Serving on http://localhost:${port}`));
