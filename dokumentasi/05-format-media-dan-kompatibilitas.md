# Format Media dan Kompatibilitas

## Foto yang Diizinkan

Cloud Gallery menerima banyak format foto umum, termasuk:

- `jpg`
- `jpeg`
- `png`
- `gif`
- `webp`
- `bmp`
- `tif`
- `tiff`
- `svg`
- `avif`
- `heic`
- `heif`
- `jfif`

## Video yang Diizinkan

Cloud Gallery menerima banyak format video umum, termasuk:

- `mp4`
- `m4v`
- `mov`
- `mkv`
- `webm`
- `avi`
- `wmv`
- `flv`
- `mpg`
- `mpeg`
- `m2ts`
- `ts`
- `mts`
- `3gp`
- `3g2`
- `ogv`
- `ogg`
- `vob`

## Cara Validasi File

Validasi upload tidak hanya mengandalkan MIME type. Sistem memakai kombinasi:

- MIME type dari browser
- ekstensi file asli

Ini penting untuk format seperti `mkv` atau `mov` yang kadang dikirim browser dengan MIME yang tidak konsisten.

## Thumbnail dan Metadata

- Gambar diproses dengan `sharp`
- Video diproses dengan `ffprobe` dan `ffmpeg`

Jika thumbnail atau metadata gagal dibuat:

- file asli tetap disimpan
- record media tetap masuk database
- status media ditandai gagal diproses
- UI grid memakai placeholder preview

## Catatan Playback Browser

Server mendukung streaming byte-range untuk video, tetapi browser tetap menentukan apakah format/codec tertentu bisa diputar. Praktiknya:

- `mp4` dan `webm` biasanya paling aman
- `mov` sering bisa diputar tergantung codec
- `mkv` bisa diupload dan distream, tetapi playback di browser tidak selalu tersedia

Untuk format yang tidak bisa diputar langsung di browser, pengguna masih bisa membuka file asli.
