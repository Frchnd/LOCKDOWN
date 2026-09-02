# LOCKDOWN PWA

Playable PWA vertical slice berdasarkan LOCKDOWN Greenfield Master Game Specification.

## Jalankan lokal
PWA/service worker tidak bekerja optimal jika `index.html` dibuka langsung dengan `file://`.
Serve folder ini melalui localhost:

```bash
python -m http.server 8080
```

Lalu buka:

`http://localhost:8080`

## Install di Android
1. Host folder ini di HTTPS (GitHub Pages / Netlify / Cloudflare Pages / server HTTPS lain), atau gunakan localhost untuk testing.
2. Buka di Chrome Android.
3. Pilih **Install app / Add to Home Screen**.
4. Setelah asset pertama kali tercache, game dapat dibuka offline.

## Isi build
- `index.html` — app shell
- `app.css` — dark portrait UI
- `app.js` — state, simulation, story, station, survivor, expedition, save/load
- `manifest.webmanifest` — install metadata
- `sw.js` — offline cache
- `assets/menu-bg.webp` — cinematic menu background
- `assets/icon-192.png`, `icon-512.png` — PWA icons

## Implemented
- Main Menu + Continue/New Game/Archive/Settings
- 7-frame prologue
- Day/time simulation
- 8 core stats
- Local autosave (`lockdown_save`)
- Guided onboarding: Gudang → Generator → Keamanan → Radio → survive to 20:00
- 2×4 station grid
- Contextual inventory
- Generator, Medis, Kasur, Keamanan, Meja Kerja, Radio
- Upgrade Lv1–Lv3 + MAX state
- Daily objectives and reward
- Maya & Raka survivor systems
- Trust, tension, talk/feed/special help
- World condition cycle
- Expedition locations + loot/risk
- Relay multi-stage mission
- ECHO-7 / HAVEN-3 story beats
- Day 5, Day 6, Day 7 finale flow
- Random bunker emergencies
- Game Over lock
- Offline service worker

## Scope note
Ini playable PWA vertical slice, bukan release-final production build. Audio assets/Web Audio ambience, seluruh variasi encounter, dedicated cinematic image per prologue frame, dan Android native WebView wrapper belum dibundel di paket PWA ini.
