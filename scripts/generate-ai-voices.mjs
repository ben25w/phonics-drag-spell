// Fills in AI voices for every word that has no recording yet.
// Never overwrites a teacher recording (the server refuses with 409).
//
//   OPENAI_API_KEY=... ADMIN_PASSCODE=... node scripts/generate-ai-voices.mjs
//   Options: --site https://phonics-drag-spell.pages.dev   --force (redo AI clips)   --dry-run
//
// Not yet run against the live site: check a few clips on the recording page
// before relying on them.

const args = process.argv.slice(2);
const flag = name => args.includes(name);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const SITE = opt('--site', 'https://phonics-drag-spell.pages.dev').replace(/\/$/, '');
const MODEL = process.env.TTS_MODEL || 'gpt-4o-mini-tts';
const VOICE = process.env.TTS_VOICE || 'fable';
const INSTRUCTIONS = process.env.TTS_INSTRUCTIONS ||
  'Say this single word clearly and slowly in a British English accent, like a primary school teacher teaching phonics. Say only the word, with no extra sounds.';

const key = process.env.OPENAI_API_KEY;
const pass = process.env.ADMIN_PASSCODE;
if (!flag('--dry-run') && (!key || !pass)) {
  console.error('Set OPENAI_API_KEY and ADMIN_PASSCODE (or use --dry-run).');
  process.exit(1);
}

const stages = (await (await fetch(`${SITE}/api/stages`)).json()).stages;
const maxStage = Math.max(...stages.map(s => +s.stage));
const { words } = await (await fetch(`${SITE}/api/words?stage=${maxStage}`)).json();

const seen = new Set();
const todo = words.filter(w => {
  if (seen.has(w.word)) return false;
  seen.add(w.word);
  if (w.audio_source === 'teacher') return false;
  if (w.audio_source === 'ai' && !flag('--force')) return false;
  return true;
});

console.log(`${todo.length} words need an AI voice (of ${seen.size}).`);
if (flag('--dry-run')) { console.log(todo.map(w => w.word).join(' ')); process.exit(0); }

let ok = 0;
for (const w of todo) {
  const tts = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, voice: VOICE, input: w.word, instructions: INSTRUCTIONS, response_format: 'mp3' })
  });
  if (!tts.ok) { console.error(`${w.word}: TTS failed (${tts.status}) ${await tts.text()}`); continue; }
  const audio = Buffer.from(await tts.arrayBuffer());

  const up = await fetch(`${SITE}/api/audio/${w.word}?source=ai`, {
    method: 'PUT',
    headers: { 'X-Passcode': pass, 'Content-Type': 'audio/mpeg' },
    body: audio
  });
  if (!up.ok) { console.error(`${w.word}: upload failed (${up.status}) ${await up.text()}`); continue; }
  ok++;
  console.log(`${w.word} ✓`);
}
console.log(`Done: ${ok} / ${todo.length} uploaded.`);
