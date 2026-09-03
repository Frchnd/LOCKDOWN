# LOCKDOWN PWA v0.11 — Sleep Station Pass

## Kasur
- Kasur sekarang punya full-panel Rest Module sendiri.
- Durasi tidur tetap 1–8 jam dan preview berubah real-time mengikuti slider.
- Preview menampilkan Health, Fatigue, Moral, Lapar, Haus, dan Daya sebelum → sesudah.
- Recovery mengikuti level Kasur: Lv1 2.5 Health/jam & -8 Fatigue/jam; Lv2 3.25 & -10; Lv3 4 & -12.
- Heal multiplier Fatigue ditampilkan: >=85 = 75%, >=65 = 90%, di bawah 65 = 100%.
- Moral sleep +0.35/jam tetap berlaku.
- Lapar/Haus/Power tetap bergerak selama tidur sesuai simulasi per jam.
- Jika tidur melewati 00:00, UI memberi warning bahwa survivor upkeep, objective baru, dan story dapat diproses.
- Jam selesai tidur ditampilkan sebelum konfirmasi.
- Upgrade Kasur tetap terlihat sampai Lv3/MAX.

## PWA update reliability
- Mempertahankan network-first shell strategy dari v0.10.1 cache hotfix.
- Cache dinaikkan ke v11 dan app.css/app.js memakai query v0.11.
- Save key tetap `lockdown_save`.
- Folder audio tidak disertakan/ditimpa oleh UPDATE ONLY.
