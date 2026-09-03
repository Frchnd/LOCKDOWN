# LOCKDOWN PWA v0.5 — Cinematic Prologue

## Prologue integration
- 7 fixed cinematic images integrated into New Game and Story Archive replay.
- Portrait assets: 900×1600 WebP, optimized for phone-first display.
- Frames follow the Chapter 1 master specification:
  1. Siaran Darurat
  2. Langit Menyala
  3. Kota Runtuh
  4. Di Bawah Rumah
  5. Lockdown Engaged
  6. Sistem Kembali Hidup
  7. Bertahan Bukan Tujuan Akhir
- New cinematic vignette, image drift, fade-in curtain, copy entrance, progress indicator, and safe-area layout.
- Tap anywhere outside the button or swipe left to advance; button remains available for explicit navigation.
- Prologue replay still works from Story Archive.

## PWA/cache
- Service-worker cache bumped to `lockdown-pwa-v5-cinematic-prologue`.
- All 7 prologue WebP assets are part of the offline core cache.
- Non-navigation offline misses no longer receive `index.html` as a fake image/audio response.

## Compatibility
- Existing `lockdown_save` save data is preserved.
- Audio paths and gameplay systems are unchanged from the previous build.
