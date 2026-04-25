# Operasional dan Pengembangan

## Build Asset

CSS dibangun ke:

```text
public/assets/app.css
```

Perintah:

```bash
npm run build:css
```

## Branch Git

Workflow yang dipakai:

- `main` untuk baseline stabil
- `development` untuk perubahan aktif

## Hal yang Perlu Diperhatikan

- Ganti `SESSION_SECRET` untuk produksi
- Ganti kredensial MariaDB default
- Ganti password admin default
- Pastikan volume Docker untuk upload dan thumbnail dipersist
- Pastikan `ffmpeg` tersedia pada environment non-Docker

## Pengembangan Berikutnya yang Masuk Akal

- delete/move media
- rename folder/media
- background queue untuk thumbnail dan transcode
- transcode video non-browser-friendly ke MP4/HLS
- fulltext search yang lebih lanjut
- audit log admin
