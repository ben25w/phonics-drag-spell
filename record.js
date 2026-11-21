// Teacher recording page. Records each word in the browser and uploads it
// to /api/audio/<word>. Needs the ADMIN_PASSCODE secret on the site.
(function () {
  const $ = id => document.getElementById(id);
  const PASS_KEY = 'phonics-record-pass';

  let passcode = '';
  let stages = [];
  let words = [];            // [{word, stage, image_url, audio_url, audio_source}]
  let current = null;        // selected word object
  let recorder = null;
  let stream = null;
  let player = new Audio();

  // ── helpers ─────────────────────────────────────────────
  function say(text, isErr) {
    const m = $('msg');
    m.textContent = text || '';
    m.className = isErr ? 'err' : '';
  }

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      ...opts,
      headers: { ...(opts.headers || {}), 'X-Passcode': passcode }
    });
    let data = null;
    try { data = await res.json(); } catch { /* not JSON */ }
    if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
    return data;
  }

  function pickMime() {
    const options = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];
    return options.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
  }

  // ── data ────────────────────────────────────────────────
  async function load() {
    const sres = await fetch('/api/stages');
    stages = (await sres.json()).stages || [];
    const maxStage = Math.max(...stages.map(s => +s.stage));
    const wres = await fetch(`/api/words?stage=${maxStage}`);
    const all = (await wres.json()).words || [];
    const seen = new Set();
    words = all.filter(w => !seen.has(w.word) && seen.add(w.word))
      .sort((a, b) => a.stage - b.stage || a.word.localeCompare(b.word));
  }

  const hasMine = w => w.audio_source === 'teacher';

  // ── rendering ───────────────────────────────────────────
  function renderStages() {
    const box = $('stages');
    box.innerHTML = '';
    stages.forEach(st => {
      const ws = words.filter(w => +w.stage === +st.stage);
      if (!ws.length) return;
      const done = ws.filter(hasMine).length;
      const head = document.createElement('div');
      head.className = 'stage-head';
      head.innerHTML = `<span>Stage ${st.stage}: ${st.label}</span><small>${done} / ${ws.length} in your voice</small>`;
      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.innerHTML = `<span style="width:${(done / ws.length) * 100}%"></span>`;
      const list = document.createElement('div');
      list.className = 'words';
      ws.forEach(w => {
        const b = document.createElement('button');
        b.className = 'w ' + (w.audio_source || '') + (current && current.word === w.word ? ' sel' : '');
        b.innerHTML = `<span class="dot"></span>${w.word}`;
        b.addEventListener('click', () => select(w));
        list.appendChild(b);
      });
      box.append(head, bar, list);
    });
  }

  function renderCurrent() {
    if (!current) return;
    $('cur-word').textContent = current.word;
    const img = $('cur-img');
    img.src = current.image_url || '';
    img.style.visibility = current.image_url ? 'visible' : 'hidden';
    const src = current.audio_source;
    $('cur-status').textContent =
      src === 'teacher' ? 'Recorded in your voice.' :
      src === 'ai' ? 'Currently an AI voice. Record yours to replace it.' :
      'Not recorded yet.';
    $('play-btn').hidden = !current.audio_url;
    $('del-btn').hidden = !current.audio_url;
    $('rec-btn').textContent = hasMine(current) ? '● Re-record' : '● Record';
  }

  function select(w) {
    if (recorder) return;
    current = w;
    say('');
    renderCurrent();
    renderStages();
  }

  function nextMissing() {
    const after = current ? words.indexOf(current) : -1;
    const order = [...words.slice(after + 1), ...words.slice(0, after + 1)];
    return order.find(w => !hasMine(w)) || null;
  }

  // ── recording ───────────────────────────────────────────
  async function startRecording() {
    if (!window.MediaRecorder || !navigator.mediaDevices) {
      say('This browser cannot record. Try Chrome, Edge or Safari.', true);
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      say('Microphone blocked. Allow it in the browser address bar and try again.', true);
      return;
    }
    const mime = pickMime();
    const chunks = [];
    recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => finishRecording(new Blob(chunks, { type: recorder.mimeType || mime || 'audio/webm' }));
    recorder.start();
    $('rec-btn').textContent = '■ Stop';
    $('rec-btn').classList.add('recording');
    say('Recording… say the word, then press Stop.');
  }

  function stopRecording() {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }

  async function finishRecording(blob) {
    stream.getTracks().forEach(t => t.stop());
    recorder = null;
    $('rec-btn').classList.remove('recording');
    const word = current;
    if (blob.size < 800) {
      say('That was too short. Try again.', true);
      renderCurrent();
      return;
    }
    say('Saving…');
    try {
      await api(`/api/audio/${word.word}`, {
        method: 'PUT',
        headers: { 'Content-Type': blob.type.split(';')[0] },
        body: blob
      });
      await load();
      current = words.find(w => w.word === word.word) || current;
      renderCurrent();
      renderStages();
      say('Saved. Playing it back…');
      play();
    } catch (e) {
      say(e.message, true);
      renderCurrent();
    }
  }

  function play() {
    if (!current || !current.audio_url) return;
    player.pause();
    player = new Audio(current.audio_url);
    player.onended = () => say('Saved.');
    player.play().catch(() => {});
  }

  async function remove() {
    if (!current || !confirm(`Delete the recording for "${current.word}"?`)) return;
    try {
      await api(`/api/audio/${current.word}`, { method: 'DELETE' });
      await load();
      current = words.find(w => w.word === current.word) || current;
      renderCurrent();
      renderStages();
      say('Deleted.');
    } catch (e) {
      say(e.message, true);
    }
  }

  // ── start-up ────────────────────────────────────────────
  async function unlock(code) {
    passcode = code;
    try {
      await api('/api/audio-check');
    } catch (e) {
      passcode = '';
      sessionStorage.removeItem(PASS_KEY);
      $('lock-msg').textContent = e.message;
      return false;
    }
    sessionStorage.setItem(PASS_KEY, code);
    await load();
    $('lock').hidden = true;
    $('app').hidden = false;
    current = nextMissing() || words[0];
    renderCurrent();
    renderStages();
    return true;
  }

  $('lock-form').addEventListener('submit', e => {
    e.preventDefault();
    $('lock-msg').textContent = '';
    unlock($('passcode').value);
  });
  $('rec-btn').addEventListener('click', () => (recorder ? stopRecording() : startRecording()));
  $('play-btn').addEventListener('click', play);
  $('del-btn').addEventListener('click', remove);
  $('next-btn').addEventListener('click', () => {
    const n = nextMissing();
    if (n) select(n); else say('Every word has your voice. Nice work!');
  });

  const saved = sessionStorage.getItem(PASS_KEY);
  if (saved) unlock(saved);
})();
