# Cloud Gallery

Galeri self-hosted berbasis Node.js, EJS, Tailwind, dan MariaDB dengan fitur dasar ala Immich:

- Upload foto dan video ke folder logis bertingkat
- Drag-and-drop upload dengan progress bar
- Infinite scroll untuk listing media
- Role sederhana `admin` dan `user`
- Thumbnail untuk gambar dan video
- Playback video dengan dukungan seek/range streaming
- Search media berdasarkan nama file
- UI modern, mobile friendly, tema terang dan gelap
- Siap dijalankan via Docker Compose

## Arsitektur Singkat

- Folder disimpan sebagai struktur logis di database.
- File asli disimpan ke storage yang di-shard per tanggal dan prefix acak.
- Thumbnail disimpan terpisah.
- Listing media memakai cursor pagination, jadi tetap aman saat satu folder logis berisi sampai 10 ribu item.

## Dokumentasi

Dokumentasi lengkap tersedia di [dokumentasi/README.md](D:/code/nodejs/full-stack/Cloud-Gallery/dokumentasi/README.md).

## Jalankan Lokal

1. Salin `.env.example` menjadi `.env`
2. Siapkan MariaDB dan `ffmpeg`
3. Install dependency:

```bash
npm install
```

4. Build CSS:

```bash
npm run build:css
```

5. Jalankan:

```bash
npm start
```

Admin default dibuat otomatis saat boot pertama:

- Email: `admin@cloud-gallery.local`
- Password: `ChangeMe123!`

## Jalankan Dengan Docker

```bash
docker compose up --build
```

Aplikasi tersedia di `http://localhost:3000`.

## Catatan Operasional

- Untuk video thumbnail dan metadata, container aplikasi menginstall `ffmpeg`.
- Media tidak diekspos langsung sebagai static file; akses lewat route terproteksi.
- Untuk folder besar, UI memuat batch media berikutnya otomatis dengan infinite scroll berbasis cursor `nextCursor`.
- Format seperti `mkv`, `mov`, dan `avi` dapat diupload, tetapi hasil playback tetap mengikuti dukungan browser dan codec file.
