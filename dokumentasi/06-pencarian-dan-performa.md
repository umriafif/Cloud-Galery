# Pencarian dan Performa

## Search Berdasarkan Nama File

Search media bekerja terhadap:

- `original_name`
- `title`

Input search tersedia di:

- dashboard untuk media root
- halaman folder untuk media dalam folder tersebut

## Karakteristik Search

- case-insensitive karena memakai collation MariaDB `utf8mb4_unicode_ci`
- query dibagi menjadi beberapa token
- semua token harus cocok
- pencarian dilakukan di sisi database, bukan di browser

Contoh:

- `liburan bali`
- `video event`
- `IMG_2026`

## Pagination Saat Search

Search tetap memakai cursor pagination. Artinya:

- hasil tidak di-load semua sekaligus
- pencarian masih aman saat hasilnya banyak
- infinite scroll tetap mempertahankan query search

## Infinite Scroll

Infinite scroll aktif pada:

- media root di dashboard
- media di halaman folder

Implementasinya:

- halaman pertama tetap dirender server-side
- batch berikutnya diminta sebagai JSON + HTML partial
- browser mengamati sentinel di bawah grid media
- saat sentinel terlihat, batch berikutnya diambil otomatis

Fallback:

- bila `IntersectionObserver` atau `fetch` tidak tersedia
- atau request berikutnya gagal

sistem masih menyediakan link manual untuk memuat batch berikutnya

## Kesiapan Folder Besar

Untuk target folder logis berisi 10 ribu media:

- listing memakai cursor, bukan offset
- file fisik disimpan ter-shard
- thumbnail dipisah dari file asli
- search berjalan langsung di DB

10 ribu baris per folder masih realistis untuk pendekatan ini, terutama karena UI hanya mengambil sebagian item per request.
