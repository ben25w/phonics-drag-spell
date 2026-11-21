# Phonics Game Next Steps

## Current state
- Production is live at `https://phonics-drag-spell.pages.dev`.
- Latest deployed work fixes D1/R2 bindings, repaired bad image assets, and supports drag with touch, mouse, trackpad, and stylus.
- Remote D1 `phonics-db` has 14 stages and 131 words.
- Remote R2 `phonics-images` has 131 valid JPEG images.
- Linear has not been updated yet.

## Done locally, not yet deployed (see PLAN.md, Phase 1)
- Renamed to "Phonics Drag & Spell".
- Everything scales with the screen; wide screens use a picture-left / letters-right layout; Size setting (Normal / Large / Extra large) and fullscreen button.
- Letter font picker (Print / Cursive) saved between sessions. Andika and Playwrite GB S/J are in `fonts/`.
- Correct answers now show the finished word instead of "Correct!".

## Phase 2 built locally, not yet deployed
- Options: tick the letters in play (quick picks: Up to stage, All letters, Clear, New letter only), "Must include" letter, round length (5 / 10 / 20 / all), word list where tapping a word leaves it out. Everything is remembered.
- Quick Start now uses the last-used options (stage 1 the first time).
- `server.cjs` serves the real stages and words from `seed.sql` locally, so no Cloudflare is needed to try it.
- This settles the "current stage only vs all words up to the stage" question: both are one tap.

## Phase 3 built locally, not yet deployed
- Speaker button on the picture; plays your recording, else a pre-made AI voice, else the browser's British voice. Options: "Say it automatically" and "My recordings only".
- `record.html` is the teacher recording page (progress per stage, record / play / re-record / delete). Needs the passcode secret: `wrangler pages secret put ADMIN_PASSCODE --project-name phonics-drag-spell`.
- Audio is stored in the existing R2 bucket under `audio/<word>.<ext>` (no database change). On the live site the bucket binding is named `R2_PUBLIC_URL`.
- `scripts/generate-ai-voices.mjs` fills gaps with OpenAI voices (needs `OPENAI_API_KEY`; not run yet; never overwrites your recordings).
- Local dev: `server.cjs` has an in-memory audio API, passcode `test`.
- Not tested: real microphone recording on iPad/Safari, and the R2 upload on the live site.

## Next decisions
- Choose and configure a proper public URL, for example a custom Cloudflare Pages domain under `benwiddowson.com`.
- Decide the proper app name and update the browser title and splash screen.
- Find the Google Font from the phonics PowerPoints and add it to the app.
- Confirm the school letter introduction order matches `s,a,t,p,i,n,m,d,g,o,c,k,e,u,r,h,b,f,l`.
- Review the generated Pixabay images and replace any that are unclear, unsuitable, or too abstract for young children.
- Decide whether the game should use only the current stage or all words up to the selected stage.

## Testing
- Test thoroughly on a real iPad, including drag mode with touch.
- Test drag mode on classroom laptops with trackpad and mouse.
- Test on the classroom screen.

## Later
- Move active next steps into Linear when project tracking is ready.
- Consider teacher voice recordings instead of generated sounds.
