# LOCKDOWN PWA v0.5

Cinematic Prologue integration pass for the LOCKDOWN Chapter 1 PWA.

## Deploy to existing GitHub Pages repo
Upload/replace the changed PWA files in the repo root, including the new `assets/prologue/` directory.

Important: keep your existing real audio files in `assets/audio/` when updating. This package does not replace your previously-added SFX/ambience binaries.

After GitHub Pages finishes publishing, reload once. The service worker uses a new v5 cache, so the old prologue assets should be replaced automatically.

## Prologue assets
All 7 frames are stored as optimized 900×1600 WebP files under `assets/prologue/` and cached for offline replay.
