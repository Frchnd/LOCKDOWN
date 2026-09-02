# LOCKDOWN PWA v0.2 — Polish Pass

Update ini tidak mengubah save key (`lockdown_save`), jadi save v0.1 tetap dapat dilanjutkan.

## Ditambahkan
- Web Audio API bunker ambience sintetis/offline.
- Radio static burst SFX.
- Upgrade hammer SFX: 3 hit pada 0.00 / 0.19 / 0.38 detik.
- Damage low-impact SFX.
- Master, SFX, dan Ambience volume sliders.
- Audio suspend/resume saat app background/foreground.
- Screen shake + red flash saat damage/radiation feedback.
- Install PWA button saat browser menyediakan install prompt.
- Visual polish: scanline, vignette, system strip, tighter station/card treatment.
- Service worker cache bumped ke `lockdown-pwa-v2`.

## Deploy ke GitHub Pages
Extract ZIP lalu replace/upload file di root repo. Tidak perlu `.github` atau GitHub Actions jika Pages sudah memakai `Deploy from a branch`.

File yang penting ikut terganti: `index.html`, `app.css`, `app.js`, `sw.js`.
Folder `assets/` tetap wajib ada.

Setelah GitHub Pages selesai publish, refresh halaman. Jika browser masih menampilkan `PWA v0.1`, tutup tab/app lalu buka kembali. Service worker v2 akan mengganti cache lama.

## v0.3 — Audio Asset Pass
- Radio memakai `Radio Static SFX.wav` ketika panel Radio dibuka dan berhenti saat keluar.
- Craft sukses memakai `Craft item SFX.wav`.
- Semua treatment healing memakai `Heal SFX.wav`, tetapi runtime hanya memainkan detik 9.00–11.00.
- Ambience sintetis diganti arsitekturnya untuk memakai `sound ambiene.wav` sebagai full-buffer loop lokal/offline.
- Cache dinaikkan ke `lockdown-pwa-v3` dan audio dicache secara resilient.

## v0.3-noamb
- Ambience asset diparkir sementara.
- Service worker hanya mencoba cache Radio/Craft/Heal.
- Settings ambience disembunyikan sementara agar tidak memberi kontrol palsu.
- Mapping Heal tetap terpusat pada applyHealing() dengan playback 9.00–11.00 detik.
