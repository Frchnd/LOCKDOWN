# LOCKDOWN PWA

Playable PWA vertical slice for **LOCKDOWN — Narrative Survival Management**.

## Local preview

PWA/service worker membutuhkan HTTP/HTTPS, jadi jangan buka `index.html` langsung dengan `file://`.

```bash
python3 -m http.server 8080
```

Buka `http://localhost:8080`.

## Deploy ke GitHub Pages

Repository ini sudah menyertakan workflow:

`.github/workflows/deploy-pages.yml`

### Cara paling mudah

1. Buat repository baru di GitHub, misalnya `lockdown`.
2. Upload/push seluruh isi folder ini ke branch `main`.
3. Buka **Settings → Pages**.
4. Pada **Build and deployment → Source**, pilih **GitHub Actions**.
5. Buka tab **Actions** dan pastikan workflow **Deploy LOCKDOWN to GitHub Pages** selesai hijau.
6. Kembali ke **Settings → Pages** untuk membuka URL situs.

Setelah itu setiap push ke `main` akan melakukan deploy ulang otomatis.

## Git CLI

Dari folder project:

```bash
git init
git add .
git commit -m "Initial LOCKDOWN PWA"
git branch -M main
git remote add origin https://github.com/USERNAME/lockdown.git
git push -u origin main
```

Ganti `USERNAME` dengan username GitHub kamu.

## PWA notes

- `manifest.webmanifest` memakai relative `start_url` dan `scope`, sehingga aman dipasang di project GitHub Pages seperti `/lockdown/`.
- Service worker dan cache assets juga memakai relative paths.
- GitHub Pages menggunakan HTTPS, sehingga service worker/PWA dapat aktif setelah deploy.

## v0.4 ambience

The ambience runtime expects this exact file path:

`assets/audio/Bunker AMBIENCE.wav`

Playback is handled by Web Audio with an adaptive crossfade loop (1.25–4.0 seconds depending on source duration). It plays only during gameplay, fades/stops when leaving gameplay or backgrounding the app, and resumes after foregrounding.

Settings now include Ambience on/off and Ambience Volume.
