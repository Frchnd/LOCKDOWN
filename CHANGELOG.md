# LOCKDOWN PWA v0.10 — Storage Station Pass

## Gudang
- Gudang sekarang punya identitas visual Supply Storage sendiri.
- Contextual inventory tetap hanya menampilkan Food dan Drink.
- Item dengan qty 0 otomatis hilang dari rack.
- Menambahkan ringkasan stock Food/Drink dan status stock bunker.
- Menambahkan snapshot Lapar, Haus, Fatigue, dan Moral di bagian atas Gudang.
- Setiap consumable menampilkan preview stat sebelum → sesudah berdasarkan state pemain saat ini.
- Makanan Kaleng menampilkan trade-off Haus +4 secara eksplisit.
- Kopi menampilkan Coffee Crash +1.5 fatigue/jam selama 3 jam sebelum dikonsumsi.
- Saat Coffee Crash aktif, Gudang menampilkan sisa durasinya.
- Activity Log konsumsi sekarang mencatat perubahan stat aktual setelah clamp 0–100.

## PWA
- Cache service worker dinaikkan ke v10.
- Save key tetap `lockdown_save`; save v0.9 tetap kompatibel.
- Tidak ada asset audio yang disertakan/ditimpa oleh paket UPDATE ONLY.
