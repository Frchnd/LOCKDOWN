# LOCKDOWN PWA v0.10.1 — Cache Hotfix

- Memperbaiki kasus PWA terinstall tetap menampilkan v0.9 setelah file v0.10 sudah di-deploy.
- `index.html`, `app.js`, dan `app.css` sekarang menggunakan strategi update yang tidak bergantung pada cache lama ketika online.
- `app.js` dan `app.css` memakai cache-busting query `v=0.10.1`.
- Service worker menggunakan cache baru `lockdown-pwa-v10-1-cache-hotfix`.
- Service worker menghapus cache versi lama saat aktivasi.
- Existing client otomatis direfresh satu kali ketika worker baru menggantikan worker lama.
- Registration memakai `updateViaCache: none` dan meminta update saat load.
- Offline fallback tetap tersedia setelah asset terbaru tercache.
- Gameplay/storage feature v0.10 tidak diubah.
- Active save `lockdown_save` tidak dihapus.
