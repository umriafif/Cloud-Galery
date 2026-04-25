# Ringkasan Proyek

Cloud Gallery adalah galeri media self-hosted berbasis Node.js dengan render server-side memakai EJS dan styling Tailwind CSS. Database menggunakan MariaDB, penyimpanan file memakai filesystem lokal, dan seluruh stack siap dibungkus ke Docker Compose.

## Fitur Utama

- Login dan session auth
- Role sederhana `admin` dan `user`
- Folder logis bertingkat
- Upload multi-file untuk foto dan video
- Drag-and-drop upload
- Progress bar upload berbasis `XMLHttpRequest`
- Thumbnail untuk gambar dan video
- Playback video dengan dukungan `Range` untuk seek
- Search media berdasarkan nama file
- Tema terang dan gelap
- UI responsif untuk desktop dan mobile

## Batasan Saat Ini

- Format video seperti `mkv`, `mov`, atau `avi` bisa diupload, diindeks, dan dicoba diputar, tetapi playback akhir tetap bergantung pada dukungan codec/container di browser pengguna.
- Bila thumbnail tidak bisa dibuat untuk format tertentu, file tetap disimpan dan tetap bisa dicari. Grid akan memakai placeholder preview.
- Belum ada fitur hapus, share link publik, face recognition, background queue, atau deduplikasi.
