# Arsitektur

## Stack

- Backend: Express
- View engine: EJS
- Styling: Tailwind CSS
- Session storage: MariaDB via `express-mysql-session`
- Upload handling: `multer`
- Image processing: `sharp`
- Video metadata/thumbnail: `ffprobe` dan `ffmpeg`

## Lapisan Utama

- `src/routes`: endpoint HTTP
- `src/services`: logika folder, user, media, thumbnail, storage
- `src/db`: koneksi dan migrasi
- `src/views`: halaman EJS
- `public/js`: JavaScript browser-side

## Model Data

### `users`

- identitas akun
- role `admin` atau `user`
- status aktif/nonaktif

### `folders`

- struktur logis bertingkat via `parent_id`
- kepemilikan diikat ke `owner_id`

### `media`

- metadata file
- pointer ke folder
- tipe media `image` atau `video`
- path file asli
- path thumbnail
- status pemrosesan

## Strategi Penyimpanan File

Folder database tidak dipetakan 1:1 ke direktori filesystem. File asli disimpan ke path yang di-shard berdasarkan:

- tahun
- bulan
- tanggal
- prefix acak

Contoh:

```text
storage/uploads/2026/04/25/ab/uuid-file.mp4
```

Tujuannya agar satu direktori fisik tidak dipenuhi ribuan file sekaligus.

## Strategi Listing Media

Listing media memakai cursor pagination berdasarkan:

- `created_at`
- `id`

Keuntungannya:

- tidak memakai offset besar
- lebih stabil untuk folder yang terus bertambah
- lebih cocok untuk 10 ribu item per folder dibanding pagination offset biasa
