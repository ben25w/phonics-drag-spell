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
  stages: []
};

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

// ─── Game Setup ───────────────────────────────────────────
async function startGame(stageNum, maxTries, inputMode, kbLayout) {
  state.stage       = stageNum;
  state.maxTries    = maxTries;
  state.inputMode   = inputMode;
  state.keyboardLayout = kbLayout;
  state.correctCount   = 0;
  state.wordIndex      = 0;
  state.status         = 'idle';

  const stageData = state.stages.find(s => +s.stage === +stageNum) || DEMO_STAGES[0];
  state.stageLetters = stageData.letters.split(',').map(l => l.trim());

  const words = await fetchWords(stageNum);
  state.words = shuffle([...words]);

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
    showFeedback('correct', '✓ Correct!');
    setTimeout(nextWord, 1800);
  } else {
    state.triesLeft--;
    playSound('wrong');
    renderTries();

    if (state.triesLeft <= 0) {
      state.status = 'showing-answer';
      setBoxClass('wrong');
      showFeedback('show-answer', correct.toUpperCase().split('').join(' '));
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

// ─── Touch Drag ───────────────────────────────────────────
let dragLetter = null;
const ghostEl  = document.getElementById('ghost-tile');

function getBoxUnderPoint(x, y) {
  for (const box of document.querySelectorAll('.letter-box')) {
    const r = box.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return box;
  }
  return null;
}

function moveGhost(x, y) {
  const half = 32; // half of --tile-size
  ghostEl.style.left = (x - half) + 'px';
  ghostEl.style.top  = (y - half) + 'px';
}

document.addEventListener('touchstart', e => {
  if (state.inputMode !== 'drag' || state.status !== 'idle') return;
  const tile = e.target.closest('.key-tile');
  if (!tile) return;
  e.preventDefault();
  dragLetter = tile.dataset.letter;
  ghostEl.textContent  = dragLetter;
  ghostEl.style.display = 'flex';
  moveGhost(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

document.addEventListener('touchmove', e => {
  if (!dragLetter) return;
  e.preventDefault();
  const { clientX, clientY } = e.touches[0];
  moveGhost(clientX, clientY);

  // Highlight box under finger
  document.querySelectorAll('.letter-box').forEach(b => b.classList.remove('drag-over'));
  const box = getBoxUnderPoint(clientX, clientY);
  if (box && state.boxes[parseInt(box.dataset.index)] === null) {
    box.classList.add('drag-over');
  }
}, { passive: false });

document.addEventListener('touchend', e => {
  if (!dragLetter) return;
  ghostEl.style.display = 'none';
  document.querySelectorAll('.letter-box').forEach(b => b.classList.remove('drag-over'));

  const { clientX, clientY } = e.changedTouches[0];
  const box = getBoxUnderPoint(clientX, clientY);
  if (box) placeLetter(parseInt(box.dataset.index), dragLetter);

  dragLetter = null;
});

// Cancel drag if touch is interrupted
document.addEventListener('touchcancel', () => {
  dragLetter = null;
  ghostEl.style.display = 'none';
  document.querySelectorAll('.letter-box').forEach(b => b.classList.remove('drag-over'));
});

// ─── Click delegation (tap mode + mouse testing on desktop) ──
document.addEventListener('click', e => {
  const tile = e.target.closest('.key-tile');
  if (tile) handleKeyTileClick(tile.dataset.letter);
});

// ─── Init ─────────────────────────────────────────────────
async function init() {
  state.stages = await fetchStages();
  populateStageSelect(state.stages);

  // Settings toggles
  bindToggleGroup('input-mode-group',     v => { state.inputMode = v; });
  bindToggleGroup('keyboard-layout-group', v => { state.keyboardLayout = v; });
  bindToggleGroup('tries-group',          v => { state.maxTries = parseInt(v); });

  // Splash
  document.getElementById('btn-quick-start').addEventListener('click', () => {
    const s = state.stages[0]; // always start at stage 1
    startGame(s.stage, 3, 'drag', 'intro');
  });

  document.getElementById('btn-options').addEventListener('click', () => {
    showScreen('screen-settings');
  });

  // Settings
  document.getElementById('btn-back-from-settings').addEventListener('click', () => {
    showScreen('screen-splash');
  });

  document.getElementById('btn-start').addEventListener('click', () => {
    const stageNum = parseInt(document.getElementById('stage-select').value);
    const maxTries = parseInt(document.querySelector('#tries-group .toggle.active').dataset.value);
    const inputMode = document.querySelector('#input-mode-group .toggle.active').dataset.value;
    const kbLayout  = document.querySelector('#keyboard-layout-group .toggle.active').dataset.value;
    startGame(stageNum, maxTries, inputMode, kbLayout);
  });

  // Game
  document.getElementById('btn-exit-game').addEventListener('click', () => {
    dragLetter = null;
    ghostEl.style.display = 'none';
    showScreen('screen-splash');
  });

  // End
  document.getElementById('btn-play-again').addEventListener('click', () => {
    startGame(state.stage, state.maxTries, state.inputMode, state.keyboardLayout);
  });

  document.getElementById('btn-new-game').addEventListener('click', () => {
    showScreen('screen-settings');
  });
}

init();
