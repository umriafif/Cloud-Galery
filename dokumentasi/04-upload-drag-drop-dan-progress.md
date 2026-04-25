# Upload Drag-and-Drop dan Progress

## Mode Upload

Upload mendukung dua mode:

- Klik area upload untuk memilih file
- Drag-and-drop file ke area upload

## Progress Bar

Saat JavaScript aktif, form upload akan:

- mencegah submit penuh halaman
- mengirim `FormData` lewat `XMLHttpRequest`
- menampilkan progress berdasarkan event `xhr.upload.progress`
- menampilkan hasil sukses, parsial, atau gagal
- me-reload halaman setelah upload selesai agar data terbaru langsung tampil

## Fallback

Jika JavaScript tidak aktif:

- form tetap bekerja sebagai submit HTML biasa
- server tetap memproses upload
- hasil tetap dikembalikan lewat redirect + flash message

## Respons Async

Endpoint upload dapat memberi JSON bila request memakai:

- header `X-Requested-With: XMLHttpRequest`
- atau `Accept: application/json`

Contoh bentuk respons:

```json
{
  "ok": true,
  "successCount": 3,
  "failedCount": 1,
  "failed": [
    "broken-file.mov: Format file tidak didukung."
  ],
  "message": "3 file berhasil diunggah, 1 gagal."
}
```

## Endpoint Upload

- `POST /upload`
- `POST /folders/:id/upload`
