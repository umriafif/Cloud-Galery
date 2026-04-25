# Instalasi dan Menjalankan

## Kebutuhan Minimum

- Node.js 22
- NPM 11 atau setara
- MariaDB
- `ffmpeg` dan `ffprobe`

## Jalankan Lokal

1. Salin `.env.example` menjadi `.env`
2. Pastikan MariaDB aktif
3. Pastikan `ffmpeg` dan `ffprobe` bisa dipanggil dari terminal
4. Install dependency:

```bash
npm install
```

5. Build CSS:

```bash
npm run build:css
```

6. Jalankan aplikasi:

```bash
npm start
```

7. Buka:

```text
http://localhost:3000
```

## Jalankan Dengan Docker

Perintah:

```bash
docker compose up --build
```

Service default:

- App: `http://localhost:3000`
- MariaDB tidak dipublish ke host
- App tetap terhubung ke MariaDB internal lewat network Docker pada host `mariadb:3306`

## Akun Admin Default

- Email: `admin@cloud-gallery.local`
- Password: `ChangeMe123!`

Ubah password default sebelum dipakai di lingkungan produksi.
