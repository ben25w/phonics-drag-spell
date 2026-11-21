// ─── State ────────────────────────────────────────────────
const state = {
  stage: 1,
  stageLetters: ['s','a','t','p','i','n'],
  words: [],
  wordIndex: 0,
  boxes: [],
  triesLeft: 3,
  maxTries: 3,
  inputMode: 'drag',
  keyboardLayout: 'intro',
  selectedLetter: null,
  status: 'idle',
  correctCount: 0,
  stages: [],
  allWords: []
};

// ─── Saved settings (everything in Options is remembered) ─
const SETTINGS_KEY = 'phonics-drag-spell-settings';
const prefs = {
  size: 'normal', font: 'print',
  tries: 3, input: 'drag', keyboard: 'intro',
  stage: 1,        // last "Up to stage" quick pick
  letters: null,   // letters in play; null = use stage letters
  focus: '',       // word must contain this letter ('' = any)
  excluded: [],    // words the teacher has left out
  length: 10,      // words per round, 0 = all
  autosay: false,  // say each word when it appears
  mineOnly: false  // only words with a teacher recording
};

function loadPrefs() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    if (['normal', 'large', 'xl'].includes(s.size)) prefs.size = s.size;
    if (['print', 'cursive'].includes(s.font)) prefs.font = s.font;
    if ([1, 3, 5].includes(s.tries)) prefs.tries = s.tries;
    if (['drag', 'tap'].includes(s.input)) prefs.input = s.input;
    if (['intro', 'qwerty'].includes(s.keyboard)) prefs.keyboard = s.keyboard;
    if (Number.isInteger(s.stage)) prefs.stage = s.stage;
    if (Array.isArray(s.letters)) prefs.letters = s.letters.filter(l => typeof l === 'string');
    if (typeof s.focus === 'string') prefs.focus = s.focus;
    if (Array.isArray(s.excluded)) prefs.excluded = s.excluded.filter(w => typeof w === 'string');
    if ([0, 5, 10, 20].includes(s.length)) prefs.length = s.length;
    if (typeof s.autosay === 'boolean') prefs.autosay = s.autosay;
    if (typeof s.mineOnly === 'boolean') prefs.mineOnly = s.mineOnly;
  } catch { /* storage unavailable: use defaults */ }
}

function savePrefs() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
}

function applyDisplaySettings() {
  document.documentElement.dataset.size = prefs.size;
  document.documentElement.dataset.font = prefs.font;
  setActiveToggle('size-group', prefs.size);
  setActiveToggle('font-group', prefs.font);
  fitLayout();
}

function setActiveToggle(groupId, value) {
  document.getElementById(groupId).querySelectorAll('.toggle').forEach(b =>
    b.classList.toggle('active', b.dataset.value === value));
}

// Shrink tiles/boxes just enough that nothing overflows (many letters,
// long words, short screens). CSS sizes everything from --fit.
function fitLayout() {
  const root = document.documentElement;
  root.style.setProperty('--fit', '1');
  if (!document.getElementById('screen-game').classList.contains('active')) return;
  const kb = document.getElementById('keyboard');
  const bx = document.getElementById('letter-boxes');
  const overflows = () =>
    kb.scrollHeight > kb.clientHeight + 1 || bx.scrollWidth > bx.clientWidth + 1;
  let fit = 1;
  while (overflows() && fit > 0.4) {
    fit = Math.round((fit - 0.05) * 100) / 100;
    root.style.setProperty('--fit', String(fit));
  }
}

// ─── Fullscreen ───────────────────────────────────────────
function fullscreenSupported() {
  const el = document.documentElement;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen);
}

function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function toggleFullscreen() {
  try {
    if (isFullscreen()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      const el = document.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    }
  } catch { /* not allowed: ignore */ }
}

function syncFullscreenState() {
  document.documentElement.classList.toggle('is-fullscreen', isFullscreen());
  fitLayout();
}

// ─── Demo data (used when D1 database is not yet set up) ──
const DEMO_STAGES = [
  { stage: 1, label: 'SATPIN',  letters: 's,a,t,p,i,n' },
  { stage: 2, label: '+ M',     letters: 's,a,t,p,i,n,m' },
  { stage: 3, label: '+ D',     letters: 's,a,t,p,i,n,m,d' },
  { stage: 4, label: '+ G',     letters: 's,a,t,p,i,n,m,d,g' },
  { stage: 5, label: '+ O',     letters: 's,a,t,p,i,n,m,d,g,o' },
];

const DEMO_WORDS = [
  { id:1,  word:'sat', image_url:'', stage:1 },
  { id:2,  word:'sit', image_url:'', stage:1 },
  { id:3,  word:'tip', image_url:'', stage:1 },
  { id:4,  word:'tap', image_url:'', stage:1 },
  { id:5,  word:'pin', image_url:'', stage:1 },
  { id:6,  word:'pit', image_url:'', stage:1 },
  { id:7,  word:'tin', image_url:'', stage:1 },
  { id:8,  word:'nap', image_url:'', stage:1 },
  { id:9,  word:'man', image_url:'', stage:2 },
  { id:10, word:'mat', image_url:'', stage:2 },
  { id:11, word:'map', image_url:'', stage:2 },
  { id:12, word:'din', image_url:'', stage:3 },
  { id:13, word:'dim', image_url:'', stage:3 },
  { id:14, word:'dad', image_url:'', stage:3 },
  { id:15, word:'sad', image_url:'', stage:3 },
  { id:16, word:'dig', image_url:'', stage:4 },
  { id:17, word:'pig', image_url:'', stage:4 },
  { id:18, word:'gap', image_url:'', stage:4 },
  { id:19, word:'top', image_url:'', stage:5 },
  { id:20, word:'dog', image_url:'', stage:5 },
  { id:21, word:'pot', image_url:'', stage:5 },
  { id:22, word:'mop', image_url:'', stage:5 },
];

// ─── Audio ────────────────────────────────────────────────
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (type === 'correct') {
      tone(ctx, 523, 0,    0.12);
      tone(ctx, 659, 0.13, 0.12);
      tone(ctx, 784, 0.26, 0.28);
    } else {
      tone(ctx, 150, 0, 0.35, 'sawtooth', 0.45);
    }
  } catch (e) { /* audio not supported */ }
}

function tone(ctx, freq, delay, dur, type = 'sine', vol = 0.28) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + dur + 0.05);
}

// ─── API ──────────────────────────────────────────────────
async function fetchStages() {
  try {
    const res = await fetch('/api/stages');
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    if (!data.stages || data.stages.length === 0) throw new Error('empty');
    return data.stages;
  } catch {
    return DEMO_STAGES;
  }
}

async function fetchWords(stageNum) {
  try {
    const res = await fetch(`/api/words?stage=${stageNum}`);
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    if (!data.words || data.words.length === 0) throw new Error('empty');
    return data.words;
  } catch {
    return DEMO_WORDS.filter(w => w.stage <= stageNum);
  }
}

// ─── Saying the word ──────────────────────────────────────
// Order: teacher recording or pre-made voice (audio_url), then the browser's own voice.
const voiceEl = new Audio();
let voicesCache = [];
let speakingTimer = null;

function loadVoices() {
  if ('speechSynthesis' in window) voicesCache = speechSynthesis.getVoices();
}
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

function pickVoice() {
  const gb = voicesCache.filter(v => /^en[-_]GB/i.test(v.lang));
  const preferred = ['Daniel', 'Kate', 'Serena', 'Google UK English Female', 'Google UK English Male'];
  for (const name of preferred) {
    const v = gb.find(x => x.name.includes(name));
    if (v) return v;
  }
  return gb[0] || voicesCache.find(v => /^en/i.test(v.lang)) || null;
}

function setSpeaking(on) {
  const btn = document.getElementById('btn-speak');
  btn.classList.toggle('speaking', on);
  clearTimeout(speakingTimer);
  if (on) speakingTimer = setTimeout(() => btn.classList.remove('speaking'), 2500);
}

function speakSynth(text) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB';
  u.rate = 0.8;
  const v = pickVoice();
  if (v) u.voice = v;
  u.onend = () => setSpeaking(false);
  speechSynthesis.cancel();
  setSpeaking(true);
  speechSynthesis.speak(u);
}

function speakWord(word) {
  if (!word) return;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  voiceEl.pause();
  if (word.audio_url) {
    voiceEl.src = word.audio_url;
    voiceEl.onended = () => setSpeaking(false);
    setSpeaking(true);
    voiceEl.play().catch(() => speakSynth(word.word));
  } else {
    speakSynth(word.word);
  }
}

// Browsers (iPad especially) only allow sound after a tap, so the first tap
// anywhere quietly unlocks the audio player for later automatic playback.
document.addEventListener('pointerdown', function unlock() {
  document.removeEventListener('pointerdown', unlock);
  voiceEl.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  voiceEl.play().then(() => voiceEl.pause()).catch(() => {});
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
}, { once: true });

// ─── Screen Navigation ────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ─── Settings helpers ─────────────────────────────────────
function bindToggleGroup(groupId, onSelect) {
  document.getElementById(groupId).querySelectorAll('.toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById(groupId).querySelectorAll('.toggle')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onSelect(btn.dataset.value);
    });
  });
}

function populateStageSelect(stages) {
  const sel = document.getElementById('stage-select');
  sel.innerHTML = '';
  stages.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.stage;
    opt.textContent = `Stage ${s.stage}: ${s.label}`;
    sel.appendChild(opt);
  });
}

// ─── Word selection ───────────────────────────────────────
function letterOrder() {
  const last = state.stages[state.stages.length - 1];
  return last.letters.split(',').map(l => l.trim());
}

function lettersForStage(stageNum) {
  const st = state.stages.find(s => +s.stage === +stageNum) || state.stages[0];
  return st.letters.split(',').map(l => l.trim());
}

// Words whose letters are all ticked (and that contain the focus letter).
function candidateWords() {
  const set = new Set(prefs.letters);
  return state.allWords.filter(w =>
    [...w.word.toLowerCase()].every(c => set.has(c)) &&
    (!prefs.focus || w.word.toLowerCase().includes(prefs.focus)));
}

const hasTeacherVoice = w => w.audio_source === 'teacher';

function playableWords() {
  return candidateWords().filter(w =>
    !prefs.excluded.includes(w.word) && (!prefs.mineOnly || hasTeacherVoice(w)));
}

function refreshWordsUI() {
  const order = letterOrder();
  const set = new Set(prefs.letters);

  // Letter chips
  const picker = document.getElementById('letter-picker');
  picker.innerHTML = '';
  order.forEach(l => {
    const b = document.createElement('button');
    b.className = 'letter-chip' + (set.has(l) ? ' active' : '');
    b.textContent = l;
    b.setAttribute('aria-pressed', set.has(l));
    b.addEventListener('click', () => {
      if (set.has(l)) prefs.letters = prefs.letters.filter(x => x !== l);
      else prefs.letters = order.filter(x => set.has(x) || x === l);
      if (prefs.focus && !prefs.letters.includes(prefs.focus)) prefs.focus = '';
      savePrefs();
      refreshWordsUI();
    });
    picker.appendChild(b);
  });

  // "Must include" options (only letters currently ticked)
  const focus = document.getElementById('focus-select');
  focus.innerHTML = '';
  const any = document.createElement('option');
  any.value = ''; any.textContent = 'Any letter';
  focus.appendChild(any);
  order.filter(l => set.has(l)).forEach(l => {
    const o = document.createElement('option');
    o.value = l; o.textContent = l;
    focus.appendChild(o);
  });
  focus.value = prefs.focus;

  // Word list: everything that matches, with left-out words dimmed
  const cands = candidateWords();
  const list = document.getElementById('word-list');
  list.innerHTML = '';
  cands.forEach(w => {
    const off = prefs.excluded.includes(w.word);
    const b = document.createElement('button');
    b.className = 'word-chip' + (off ? ' off' : '');
    b.textContent = w.word + (hasTeacherVoice(w) ? ' 🎙' : '');
    b.setAttribute('aria-pressed', !off);
    b.addEventListener('click', () => {
      prefs.excluded = off ? prefs.excluded.filter(x => x !== w.word) : [...prefs.excluded, w.word];
      savePrefs();
      refreshWordsUI();
    });
    list.appendChild(b);
  });

  const playable = playableWords();
  const ready = playable.length;
  const left = cands.filter(w => prefs.excluded.includes(w.word)).length;
  const mine = playable.filter(hasTeacherVoice).length;
  const anyMine = state.allWords.some(hasTeacherVoice);
  document.getElementById('word-count').textContent =
    prefs.letters.length === 0 ? 'Pick at least one letter'
      : (prefs.mineOnly && !anyMine) ? 'No recordings yet (see the recording page)'
      : `${ready} word${ready === 1 ? '' : 's'} ready` +
        (left ? ` · ${left} left out` : '') +
        (anyMine && !prefs.mineOnly ? ` · ${mine} in your voice` : '');
  document.getElementById('btn-start').disabled = ready === 0;
}

function setLetters(letters, focus = '') {
  prefs.letters = letterOrder().filter(l => letters.includes(l));
  prefs.focus = focus;
  savePrefs();
  refreshWordsUI();
}

// ─── Game Setup ───────────────────────────────────────────
function startGame() {
  const pool = playableWords();
  if (pool.length === 0) { showScreen('screen-settings'); return; }

  state.maxTries       = prefs.tries;
  state.inputMode      = prefs.input;
  state.keyboardLayout = prefs.keyboard;
  state.correctCount   = 0;
  state.wordIndex      = 0;
  state.status         = 'idle';
  state.stageLetters   = letterOrder().filter(l => prefs.letters.includes(l));

  let words = shuffle([...pool]);
  if (prefs.length > 0) words = words.slice(0, prefs.length);
  state.words = words;

  showScreen('screen-game');
  loadWord();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Word Loading ─────────────────────────────────────────
function loadWord() {
  const word = state.words[state.wordIndex];
  state.boxes = Array(word.word.length).fill(null);
  state.triesLeft    = state.maxTries;
  state.status       = 'idle';
  state.selectedLetter = null;

  // Image
  const img = document.getElementById('word-image');
  const placeholder = document.querySelector('.img-placeholder');
  if (word.image_url) {
    img.onload  = () => { img.classList.add('loaded'); placeholder.style.display = 'none'; };
    img.onerror = () => { img.classList.remove('loaded'); placeholder.style.display = 'flex'; };
    img.src = word.image_url;
    img.classList.remove('loaded');
    placeholder.style.display = 'none';
  } else {
    img.src = '';
    img.classList.remove('loaded');
    placeholder.style.display = 'flex';
  }

  document.getElementById('game-progress').textContent =
    `${state.wordIndex + 1} / ${state.words.length}`;

  renderTries();
  renderBoxes();
  renderKeyboard();
  clearFeedback();
  fitLayout();
  if (prefs.autosay) setTimeout(() => { if (state.words[state.wordIndex] === word) speakWord(word); }, 500);
}

// ─── Render ───────────────────────────────────────────────
function renderTries() {
  document.getElementById('game-tries').textContent = '❤️'.repeat(state.triesLeft);
}

function renderBoxes() {
  const container = document.getElementById('letter-boxes');
  container.innerHTML = '';
  state.boxes.forEach((letter, idx) => {
    const box = document.createElement('div');
    box.className = 'letter-box' + (letter ? ' filled' : '');
    box.dataset.index = idx;
    box.textContent   = letter || '';
    box.addEventListener('click', () => handleBoxClick(idx));
    container.appendChild(box);
  });
}

function renderKeyboard() {
  const container = document.getElementById('keyboard');
  container.innerHTML = '';
  getKeyboardLetters().forEach(letter => {
    const tile = document.createElement('div');
    tile.className      = 'key-tile';
    tile.dataset.letter = letter;
    tile.textContent    = letter;
    if (letter === state.selectedLetter) tile.classList.add('selected');
    container.appendChild(tile);
  });
}

function getKeyboardLetters() {
  if (state.keyboardLayout === 'qwerty') {
    return 'qwertyuiopasdfghjklzxcvbnm'
      .split('')
      .filter(l => state.stageLetters.includes(l));
  }
  return [...state.stageLetters];
}

function clearFeedback() {
  const fb = document.getElementById('feedback');
  fb.textContent = '';
  fb.className = 'feedback-area';
}

function showFeedback(type, text) {
  const fb = document.getElementById('feedback');
  fb.className = 'feedback-area ' + type;
  fb.textContent = text;
}

function setBoxClass(cls) {
  document.querySelectorAll('.letter-box').forEach(box => {
    box.classList.remove('correct', 'wrong');
    if (cls) box.classList.add(cls);
  });
}

// ─── Game Logic ───────────────────────────────────────────
function placeLetter(boxIdx, letter) {
  if (state.status !== 'idle') return;
  if (state.boxes[boxIdx] !== null) return;
  state.boxes[boxIdx] = letter;
  renderBoxes();
  if (state.boxes.every(b => b !== null)) checkAnswer();
}

function handleBoxClick(idx) {
  if (state.status !== 'idle') return;
  if (state.inputMode === 'tap') {
    if (state.boxes[idx] !== null) {
      state.boxes[idx] = null;
      state.selectedLetter = null;
      renderBoxes();
      renderKeyboard();
    } else if (state.selectedLetter) {
      placeLetter(idx, state.selectedLetter);
      state.selectedLetter = null;
      renderKeyboard();
    }
  } else {
    // Drag mode: tap a filled box to clear it
    if (state.boxes[idx] !== null) {
      state.boxes[idx] = null;
      renderBoxes();
    }
  }
}

function handleKeyTileClick(letter) {
  if (state.status !== 'idle') return;
  if (state.inputMode !== 'tap') return;

  if (state.selectedLetter === letter) {
    state.selectedLetter = null;
    renderKeyboard();
    return;
  }

  state.selectedLetter = letter;
  // Auto-place into first empty box
  const emptyIdx = state.boxes.findIndex(b => b === null);
  if (emptyIdx !== -1) {
    placeLetter(emptyIdx, letter);
    state.selectedLetter = null;
  }
  renderKeyboard();
}

function checkAnswer() {
  state.status = 'checking';
  const answer  = state.boxes.join('').toLowerCase();
  const correct = state.words[state.wordIndex].word.toLowerCase();

  if (answer === correct) {
    state.correctCount++;
    state.status = 'correct';
    playSound('correct');
    setBoxClass('correct');
    showFeedback('correct', '✓ ' + correct);
    setTimeout(nextWord, 1800);
  } else {
    state.triesLeft--;
    playSound('wrong');
    renderTries();

    if (state.triesLeft <= 0) {
      state.status = 'showing-answer';
      setBoxClass('wrong');
      showFeedback('show-answer', correct.split('').join(' '));
      setTimeout(nextWord, 2600);
    } else {
      state.status = 'wrong';
      setBoxClass('wrong');
      showFeedback('wrong', '✗ Try again!');
      setTimeout(() => {
        state.boxes = Array(correct.length).fill(null);
        state.status = 'idle';
        renderBoxes();
        clearFeedback();
      }, 1200);
    }
  }
}

function nextWord() {
  state.wordIndex++;
  if (state.wordIndex >= state.words.length) {
    showEndScreen();
  } else {
    loadWord();
  }
}

function showEndScreen() {
  document.getElementById('end-score').textContent =
    `${state.correctCount} out of ${state.words.length} correct!`;
  showScreen('screen-end');
}

// ─── Pointer Drag ─────────────────────────────────────────
let dragLetter = null;
let activePointerId = null;
const ghostEl  = document.getElementById('ghost-tile');

function getBoxUnderPoint(x, y) {
  for (const box of document.querySelectorAll('.letter-box')) {
    const r = box.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return box;
  }
  return null;
}

function moveGhost(x, y) {
  const half = (ghostEl.offsetWidth || 64) / 2;
  ghostEl.style.left = (x - half) + 'px';
  ghostEl.style.top  = (y - half) + 'px';
}

function clearDragTarget() {
  document.querySelectorAll('.letter-box').forEach(b => b.classList.remove('drag-over'));
}

function highlightDragTarget(x, y) {
  clearDragTarget();
  const box = getBoxUnderPoint(x, y);
  if (box && state.boxes[parseInt(box.dataset.index)] === null) {
    box.classList.add('drag-over');
  }
}

function stopDrag() {
  dragLetter = null;
  activePointerId = null;
  ghostEl.style.display = 'none';
  clearDragTarget();
}

document.addEventListener('pointerdown', e => {
  if (state.inputMode !== 'drag' || state.status !== 'idle') return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;

  const tile = e.target.closest('.key-tile');
  if (!tile) return;

  e.preventDefault();
  activePointerId = e.pointerId;
  dragLetter = tile.dataset.letter;
  ghostEl.textContent  = dragLetter;
  ghostEl.style.display = 'flex';
  moveGhost(e.clientX, e.clientY);
  highlightDragTarget(e.clientX, e.clientY);
});

document.addEventListener('pointermove', e => {
  if (!dragLetter || e.pointerId !== activePointerId) return;
  e.preventDefault();
  const { clientX, clientY } = e;
  moveGhost(clientX, clientY);
  highlightDragTarget(clientX, clientY);
});

document.addEventListener('pointerup', e => {
  if (!dragLetter || e.pointerId !== activePointerId) return;

  const { clientX, clientY } = e;
  const box = getBoxUnderPoint(clientX, clientY);
  if (box) placeLetter(parseInt(box.dataset.index), dragLetter);

  stopDrag();
});

document.addEventListener('pointercancel', e => {
  if (e.pointerId === activePointerId) stopDrag();
});

// ─── Click delegation (tap mode) ──────────────────────────
document.addEventListener('click', e => {
  const tile = e.target.closest('.key-tile');
  if (tile) handleKeyTileClick(tile.dataset.letter);
});

// ─── Init ─────────────────────────────────────────────────
async function init() {
  loadPrefs();
  applyDisplaySettings();

  // Fullscreen (hidden where the browser can't do it, e.g. iPhone)
  if (fullscreenSupported()) {
    document.querySelectorAll('.btn-fullscreen').forEach(btn => {
      btn.hidden = false;
      btn.addEventListener('click', toggleFullscreen);
    });
    document.addEventListener('fullscreenchange', syncFullscreenState);
    document.addEventListener('webkitfullscreenchange', syncFullscreenState);
  }
  window.addEventListener('resize', fitLayout);

  state.stages = await fetchStages();
  const maxStage = Math.max(...state.stages.map(s => +s.stage));
  const fetched = await fetchWords(maxStage);
  // one entry per distinct word
  const seen = new Set();
  state.allWords = fetched.filter(w => !seen.has(w.word) && seen.add(w.word));

  populateStageSelect(state.stages);
  if (!state.stages.some(s => +s.stage === prefs.stage)) prefs.stage = +state.stages[0].stage;
  document.getElementById('stage-select').value = prefs.stage;

  const known = new Set(letterOrder());
  prefs.letters = (prefs.letters || lettersForStage(prefs.stage)).filter(l => known.has(l));
  prefs.letters = letterOrder().filter(l => prefs.letters.includes(l));
  if (prefs.focus && !prefs.letters.includes(prefs.focus)) prefs.focus = '';

  setActiveToggle('input-mode-group', prefs.input);
  setActiveToggle('keyboard-layout-group', prefs.keyboard);
  setActiveToggle('tries-group', String(prefs.tries));
  setActiveToggle('length-group', String(prefs.length));
  setActiveToggle('voice-group', prefs.mineOnly ? 'mine' : 'any');
  setActiveToggle('autosay-group', prefs.autosay ? 'on' : 'off');
  refreshWordsUI();

  // Settings toggles
  bindToggleGroup('size-group', v => { prefs.size = v; savePrefs(); applyDisplaySettings(); });
  bindToggleGroup('font-group', v => { prefs.font = v; savePrefs(); applyDisplaySettings(); });
  bindToggleGroup('input-mode-group',      v => { prefs.input = v; savePrefs(); });
  bindToggleGroup('keyboard-layout-group', v => { prefs.keyboard = v; savePrefs(); });
  bindToggleGroup('tries-group',           v => { prefs.tries = parseInt(v); savePrefs(); });
  bindToggleGroup('length-group',          v => { prefs.length = parseInt(v); savePrefs(); });
  bindToggleGroup('voice-group',           v => { prefs.mineOnly = v === 'mine'; savePrefs(); refreshWordsUI(); });
  bindToggleGroup('autosay-group',         v => { prefs.autosay = v === 'on'; savePrefs(); });
  document.getElementById('btn-speak').addEventListener('click', () => speakWord(state.words[state.wordIndex]));

  // Word selection controls
  document.getElementById('stage-select').addEventListener('change', e => {
    prefs.stage = parseInt(e.target.value);
    setLetters(lettersForStage(prefs.stage));
  });
  document.getElementById('focus-select').addEventListener('change', e => {
    prefs.focus = e.target.value;
    savePrefs();
    refreshWordsUI();
  });
  document.getElementById('btn-letters-all').addEventListener('click', () => {
    prefs.stage = Math.max(...state.stages.map(s => +s.stage));
    document.getElementById('stage-select').value = prefs.stage;
    setLetters(letterOrder());
  });
  document.getElementById('btn-letters-clear').addEventListener('click', () => setLetters([]));
  document.getElementById('btn-letters-new').addEventListener('click', () => {
    const stageLetters = lettersForStage(prefs.stage);
    setLetters(stageLetters, stageLetters[stageLetters.length - 1]);
  });

  // Splash: Quick Start uses whatever was set last (stage 1 the first time)
  document.getElementById('btn-quick-start').addEventListener('click', startGame);

  document.getElementById('btn-options').addEventListener('click', () => {
    showScreen('screen-settings');
  });

  // Settings
  document.getElementById('btn-back-from-settings').addEventListener('click', () => {
    showScreen('screen-splash');
  });

  document.getElementById('btn-start').addEventListener('click', startGame);

  // Game
  document.getElementById('btn-exit-game').addEventListener('click', () => {
    stopDrag();
    voiceEl.pause();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    showScreen('screen-splash');
  });

  // End
  document.getElementById('btn-play-again').addEventListener('click', startGame);

  document.getElementById('btn-new-game').addEventListener('click', () => {
    showScreen('screen-settings');
  });
}

init();
