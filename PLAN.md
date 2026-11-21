# Phonics Drag & Spell: Big-screen, voice and fonts plan

Written 2026-11-21. Builds on `NEXT_STEPS.md`. Nothing here is built yet.

## What the code does today (why it's small)
- Picture frame is capped at `max-width: 340px` / `max-height: 290px`.
- Tiles are 64–70px, letter boxes 74–80px, fonts ~2rem. All fixed pixel sizes, so on a 1080p/4K board they look tiny.
- Font is `-apple-system` (SF), which has the double-storey **a**.
- Stage picks "all words up to this stage" only (`/api/words?stage=N` uses `stage <= N`). No way to pick letters or word lists.
- No audio for words, only synthesised ding/buzz. No recordings exist.
- Stack: static `index.html` / `app.js` / `style.css` on Cloudflare Pages, D1 `phonics-db` (stages, words), R2 `phonics-images`, Pages Functions in `functions/api`.

## Phase 1: Big screen + fonts (front-end only, no backend)
1. **Scale everything with the viewport.** Replace fixed px with a `--u` unit based on `min(vw, vh)` (tiles ≈ 11 `--u`, boxes ≈ 13 `--u`, picture fills available height) and a user **Size** setting (Normal / Large / Extra large, multiplies `--u`).
2. **Landscape board layout** (width ≥ 1000px and landscape): picture on the left (about 45% width, as big as fits), letter boxes and keyboard on the right. Portrait/iPad keeps the current stacked layout.
3. **Fullscreen button** in the game header and on the splash (Fullscreen API; iPad Safari ignores it, which is fine).
4. **Fonts, self-hosted** in `/fonts` (no Google CDN, so it works on school networks and offline). Picker in Options with a live preview of `a g t y`:
   - *Print (default)*: Andika, built for early readers, single-storey **a**, **g**, **y** with a simple tail.
   - *Cursive / school handwriting*: a Playwrite UK cut (GB S for unjoined, GB J for joined). Your `Fonts/` folder only has the DE and NZ cuts, so we need the GB ones.
   - Possibly Comic Neue as a friendly third option.
   - Applies to the tiles, letter boxes, the answer reveal and the end screen. The rest of the interface stays in one clean font.
   - **Cursive caveat:** tiles and boxes hold single letters, so joins can't show there. Use the unjoined cut in boxes and tiles, and show the finished word in the joined cut after a correct answer.
   - Also covers the open item in NEXT_STEPS ("find the Google font from the phonics PowerPoints"). Send me one slide or the font name and I'll match it.
5. **Rename** to "Phonics Drag & Spell" (browser title, splash) and update NEXT_STEPS.

*Done when:* on a laptop at 1920×1080 and a 4K board the tiles are comfortably finger-sized from the back of the room, **a** is the round one in print mode, and the choice survives a reload (saved in `localStorage`).

## Phase 2: Choose your sounds and words
Replace the single Stage dropdown with:
- **Letter picker**: tick-boxes in taught order (`s a t p i n m d g o c k e u r h b f l`). "Quick pick" buttons: *up to stage N*, *only this stage's new letter*, *all*.
- **Word filter**: a word is playable if all its letters are in the chosen set. Optional "must include [new letter]" so a lesson on **m** only gets words with **m**.
- **Word list preview**: shows the words that will come up, with a tick to drop any (so you can remove ones the children can't name from the picture).
- **Round length**: 5 / 10 / 20 / all (131 words at stage 14 is far too long a round).
- Settings remembered between sessions.
- Resolves the open question in NEXT_STEPS ("current stage only vs all words up to stage"): both become one-tap options.
- API change: `/api/words` returns all words once (131 rows, tiny) and the filtering happens in the browser. Keep `?stage=` working.

## Phase 3: Hear the word (three layers)
Play order: **your recording → pre-generated AI voice → browser voice**.

1. **Speaker button** on the picture frame (big, top corner), plus an "auto-say the word when it appears" toggle. Tap = say the word again. Never speaks the spelling, just the word.
2. **Browser voice (ships first, free):** `speechSynthesis`, preferring an `en-GB` voice. Works instantly for all 131 words but the voice varies by device and can sound robotic on school laptops.
3. **Your voice, recorded in the app:** new `/record.html` teacher page.
   - Lists words by stage with a status dot (recorded / AI / none) and a progress count per stage ("Stage 4: 31/36 recorded"), which tells you how far up the stages you're covered.
   - Big record button, plays back, re-record, next-missing-word button. Uses `MediaRecorder` straight from the browser mic (works on laptop and iPad).
   - Uploads to R2 `audio/<word>.<ext>` via `POST /api/audio/<word>`; D1 `words` gets an `audio` column (`NULL` / `ai` / `teacher`).
   - **Protected** so children can't overwrite it: a passcode stored as a Pages secret (simplest), or Cloudflare Access on `/record.html` and `POST /api/audio`.
   - Safari records mp4/AAC and Chrome records webm/Opus; we store the content type with each file and it plays on both.
4. **AI voice for the gaps (pre-generated, not live):** a script on the Mac runs once, generates a clear British-English clip for every word without a recording, and uploads it to R2. Nothing calls an AI at play time, so no API key in the site, no delay, consistent voice, pennies of cost for 131 words. Your recording always wins, and re-running only fills holes.
   - Option "Only words I've recorded" in Options, for when you want the whole round in your voice.
   - **Not for letter sounds.** TTS is poor at pure phonemes ("sss", not "sih"), so the same recorder should later also capture the 19 letter sounds for a "hear the sound" tap on the tiles (this is the "teacher voice recordings" item in NEXT_STEPS).

## Phase 4: Polish
- Confetti/star animation and a friendlier sound on correct; softer "try again".
- Hint button (reveals the next letter) for stuck children.
- "Next" button so you can skip the automatic delays when the class is excited.
- End screen lists the missed words with a "play just those again" button.
- Wake-lock so the board doesn't sleep mid-lesson.
- Installable/offline (service worker caching app files, images and audio), safe for flaky school wifi.
- Replace unclear Pixabay images (list in NEXT_STEPS), proper domain under benwiddowson.com, test on iPad, laptop trackpad and the real board.

## Suggested order
1 → 2 → 3 (browser voice + speaker button first, recorder second, AI gap-fill last) → 4. Each phase deploys on its own and the game stays working throughout.

## Decisions I need from you
1. **Fonts:** is "Andika (print) + Playwrite GB (cursive)" the right pair, or can you send a slide / font name from your phonics PowerPoints to match?
2. **AI voice provider** (for gap-filling only): OpenAI TTS (cheap, good British voices) or ElevenLabs (nicest, needs an account)? I'd default to OpenAI unless you prefer otherwise.
3. **Recorder protection:** a passcode, or Cloudflare Access with your email?
4. **Name:** "Phonics Drag & Spell" fine? (You called it "Dragon" above; the live name is `phonics-drag-spell`. Do you want an actual dragon theme?)
