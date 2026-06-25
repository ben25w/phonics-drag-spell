# Phonics Game Next Steps

## Current state
- Production is live at `https://phonics-drag-spell.pages.dev`.
- Latest deployed work fixes D1/R2 bindings, repaired bad image assets, and supports drag with touch, mouse, trackpad, and stylus.
- Remote D1 `phonics-db` has 14 stages and 131 words.
- Remote R2 `phonics-images` has 131 valid JPEG images.
- Linear has not been updated yet.

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
