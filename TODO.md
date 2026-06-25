# Phonics CVC Words — To-Do List

## Current status — 2026-06-25
- Production is deployed from commit `7961006`.
- Live API checks pass for stages, words, and R2-backed images.
- Remote D1 `phonics-db` has 14 stages and 131 words.
- Remote R2 `phonics-images` has the 131 local `.jpg` files uploaded.
- Repaired 43 image files that had been saved from a Pixabay rate-limit response instead of real image data.
- Linear has not been updated yet.

## ✅ Fixed: Pictures not showing
- [x] Confirmed Pages production bindings were mismatched with the original code.
- [x] Updated API functions to support the deployed D1 binding (`phonics-db`).
- [x] Added `/api/images/:key` to serve images from the deployed R2 bucket binding.
- [x] Seeded remote D1 and uploaded all 131 images to R2.
- [x] Replaced 42 `Rate limit exceeded` text files and converted `rip.jpg` from PNG bytes to a true JPEG.
- [x] Verified `https://phonics-drag-spell.pages.dev/api/images/sat.jpg` returns a JPEG.

## ✅ Done
- [x] All code built and on GitHub (ben25w/phonics-drag-spell)
- [x] Deployed to Cloudflare Pages
- [x] D1 database created, seed.sql run, binding added
- [x] R2 bucket created, 131 images downloaded via Pixabay script
- [x] 131 images uploaded to R2
- [x] Lowercase letters throughout
- [x] Correct word shown in lowercase when out of tries

## Deploy remaining
- [x] Upload 131 images from /images/ folder to R2 bucket
- [x] Verify deployed app can load image URLs

## Content
- [ ] Review the Pixabay images — some may not be ideal for young children, swap any that aren't clear
- [ ] Confirm the letter introduction order matches your school's sequence
      (currently: s,a,t,p,i,n,m,d,g,o,c,k,e,u,r,h,b,f,l)
- [ ] Edit seed.sql words if any don't match your school's word lists

## Design
- [ ] Find the Google Font from your phonics PowerPoints — add to index.html
- [ ] Decide on a proper app name

## Nice-to-have (post-launch)
- [ ] Test thoroughly on real iPad — verify drag works with touch
- [ ] Test drag mode on classroom laptops with trackpad/mouse
- [ ] Test on classroom screen
- [ ] Consider "current stage only" vs "all stages up to here" toggle
- [ ] Consider teacher voice recordings instead of generated beep sounds

## Known behaviour
- Drag mode uses pointer events and should work with iPad touch, stylus, mouse, and trackpad.
- Tap mode works on both desktop and iPad.
