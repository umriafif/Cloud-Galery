# Struktur Folder Proyek

```text
Cloud-Gallery/
├─ docker-compose.yml
├─ Dockerfile
├─ package.json
├─ public/
│  ├─ assets/
│  └─ js/
├─ src/
│  ├─ app.js
│  ├─ server.js
│  ├─ config/
│  ├─ db/
│  ├─ middleware/
│  ├─ routes/
│  ├─ services/
│  ├─ styles/
│  ├─ utils/
│  └─ views/
├─ storage/
│  ├─ tmp/
│  ├─ uploads/
│  └─ thumbnails/
└─ dokumentasi/
```

## Folder Penting

### `storage/tmp`

File sementara dari `multer` sebelum dipindahkan ke storage final.

### `storage/uploads`

File media asli.

### `storage/thumbnails`

Thumbnail hasil pemrosesan gambar/video.

### `src/services`

Lokasi utama business logic.

### `src/views`

Semua template halaman EJS.
