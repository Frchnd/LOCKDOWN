LOCKDOWN v0.10.1 CACHE HOTFIX — UPDATE ONLY

Replace 4 files in the ROOT of your GitHub Pages repository:
- index.html
- app.js
- app.css
- sw.js

IMPORTANT: v0.10 sebelumnya hanya mengganti app.js/app.css/sw.js. Hotfix ini JUGA perlu index.html untuk cache-busting.
Folder assets/audio tidak disentuh.
Save lockdown_save tidak dihapus.

Setelah GitHub Pages selesai deploy, buka URL Pages di browser sekali. Worker baru akan mengambil alih dan me-refresh client lama.
