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

http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    const { stages, words } = seedData();
    const stage = +(new URL(req.url, 'http://x').searchParams.get('stage') || 1);
    const body = req.url.startsWith('/api/stages')
      ? { stages }
      : { words: words.filter(w => w.stage <= stage) };
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
