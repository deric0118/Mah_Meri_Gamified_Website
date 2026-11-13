# Mah_Meri_Gamified_Website
A gamified cultural preservation web application exploring the history, crafts, and traditions of the indigenous Mah Meri people through interactive mini-games.

**Spirit of the Mangroves** is a single-page web game. Moyang Tok Naning, an ancestral spirit, guides the player across Pulau Carey to restore the crafts for Hari Moyang (Ancestor's Day):

| Act | Location | Mini-game |
|-----|----------|-----------|
| I | Mangrove Swamp | Hidden-object: find 3 pandanus leaves and 2 pieces of Nyireh Batu wood |
| II | Weaver's Hut | Kelarai pattern sequence: weave the Tempok, then the Sungu basket |
| III | Carver's Bench | Memory match of 8 carvings, then chisel the wood to reveal Moyang Harimau Berantai |
| IV | Ceremonial Fire | Tarian Jo'oh rhythm game: hit the tuntung beats (A/S/D or tap) to reach 100% Spirit Harmony |

After the journey: the **Spirit Archive** museum (Real History / Ancestral Myths) and the **Support the Artisans** portal.
Progress is saved in the browser (localStorage).

## Run locally
No build step and no dependencies. Serve the folder with any static server.

```bash
# Python (Windows: py, macOS/Linux: python3)
py -m http.server 8000
# or Node
npx serve .
```

Then open http://localhost:8000.

Opening `index.html` directly also works. Serving it over http is recommended, because the Act III carving progress uses canvas pixel data.

### Testing shortcuts
- `?screen=map`, `?screen=act1` … `?screen=act4`, `?screen=museum`, `?screen=portal` jump straight to a screen.
- The ⟲ button in the top bar resets progress.
- `App.launchMiniGame(3)` in the browser console opens an act.

## Project structure
```
index.html                 page shell: title, map, game stage, dialogue, museum, portal
css/styles.css             all styling (earthy palette + teal/gold spirit UI)
js/assets.js               every image/video path (keep exact .PNG/.png case for Linux hosting)
js/content.js              all text: dialogue, folklore, card notes, museum entries, portal links
js/state.js                progress + localStorage save
js/audio.js                Web Audio synth SFX/ambience (map real mp3s via AudioFX.files)
js/ui.js                   shared helpers (toast, floating text, particles, result panel)
js/dialogue.js             Moyang typewriter dialogue
js/games/act1-gather.js    Act I
js/games/act2-weave.js     Act II
js/games/act3-carve.js     Act III
js/games/act4-rhythm.js    Act IV
js/main.js                 router, map, HUD, act flow, museum, portal
```

Each mini-game exposes `window.Games[n] = { mount(container, { onComplete }), unmount() }`.

## Content TODO (Member 3)
- Verify the cultural accuracy of the lines marked "verify" in `js/content.js`.
- Replace the search/maps links in the portal with official artisan, tour and NGO links.
- Add photos of real Mah Meri artisans to the Spirit Archive.
- Optional: drop recorded audio into `assets/audio/` and map it in `AudioFX.files`.
