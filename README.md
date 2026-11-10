# sistem-penjadwalan-tim

Sistem Penjadwalan & Rotasi Lembur Tim - Aplikasi penjadwalan dan pencatatan lembur tim berbasis Next.js App Router, Tailwind CSS, Neon Serverless Postgres, Better Auth (Sistem 1 Pintu), dan Neon Object Storage.

## Struktur proyek

```text
src/
  app/          Halaman, layout, dan route API
  components/   Komponen UI dan fitur
  hooks/        React hooks
  lib/          Layanan aplikasi, autentikasi, dan penyimpanan
  types/        Tipe data bersama
public/         Hanya aset yang memang boleh diakses publik
scripts/        Utilitas administrasi, skema SQL, dan pemeriksaan privasi
data/           Data runtime lokal; hanya .gitkeep masuk Git
```

Konfigurasi Next.js, TypeScript, Docker, dan package manager tetap di root.
Seluruh komponen aplikasi berada di `src/components/`.
Gunakan pnpm 11.11.0 dengan Node.js 22 atau lebih baru. Lockfile resmi adalah
`pnpm-lock.yaml`; jangan membuat lockfile dari package manager lain.

## Menjalankan aplikasi

1. Jalankan `pnpm install --frozen-lockfile`.
2. Salin `.env.example` ke `.env.local` tanpa menimpa konfigurasi yang sudah ada.
3. Isi konfigurasi database, autentikasi, dan penyimpanan yang diperlukan.
   `BETTER_AUTH_SECRET` harus berupa secret acak minimal 32 karakter. Buat secara
   lokal, misalnya dengan `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`,
   lalu simpan hanya dalam konfigurasi privat.
4. Jalankan `pnpm dev` dan buka `http://localhost:3000`.

```sh
pnpm build
pnpm start
pnpm lint
pnpm exec tsc --noEmit
pnpm check:privacy
```

Kode tidak menyediakan secret autentikasi bawaan. Lingkungan produksi wajib
menyediakan `BETTER_AUTH_SECRET` sendiri. Jangan menaruh rahasia pada variabel
berawalan `NEXT_PUBLIC_`, karena nilainya dapat masuk ke kode browser.

Instalasi baru dimulai tanpa anggota tim. Tambahkan data anggota melalui aplikasi
atau konfigurasi privat. Repository publik tidak menyertakan data runtime atau
kredensial. Konfigurasi untuk menjalankan aplikasi harus disiapkan sendiri.
`scripts/init-neon-db.sql` berisi skema dan jenis tugas, tanpa data pribadi anggota.
Jangan menjalankan skrip administrasi terhadap database produksi tanpa peninjauan.

## Data pribadi

Dokumen kantor, ekspor percakapan, lampiran, cadangan, dan catatan pribadi tidak
disimpan dalam direktori repository publik. Hapus file privat dari salinan proyek
sebelum membagikannya, termasuk salinan dalam cache build dan snapshot Git.
Folder `data/` hanya menyertakan `.gitkeep`; template `.env.example` tidak berisi rahasia.
Jangan menyimpan data pribadi di `src/` atau `public/`.
Folder `public/` dilayani oleh Next.js walaupun suatu file di dalamnya diabaikan Git.
`.gitignore` bukan enkripsi atau kontrol akses ke file di komputer.

## Sebelum commit atau publikasi

Jalankan `pnpm check:privacy`, kemudian periksa `git status --short` dan
`git diff --cached`. Pemeriksaan privasi memvalidasi pola ignore, mencari file
privat yang sudah terlacak Git, memindai kandidat publik dan versi staged untuk
pola kredensial/email, serta mendeteksi file privat di `public/`.
Pemeriksaan ini bersifat heuristik; tinjau juga data pribadi di kode, gambar, dan aset baru.

Semua varian `.env*`, kredensial, dokumen internal, arsip, data runtime, cache,
hasil build, dan konfigurasi alat lokal diabaikan. Hanya template root
`.env.example` yang boleh masuk Git, dengan nilai rahasia kosong.
`AGENTS.md`, kode, skema SQL yang telah dibersihkan, dan lockfile pnpm tetap dapat dilacak.

Aturan ignore tidak menghapus file yang sudah terlacak atau riwayat commit lama.
Jangan gunakan `git add -f` pada file privat. Jika rahasia pernah terpublikasi,
cabut/ganti rahasia itu dan bersihkan riwayat secara terpisah.

## Docker

`.dockerignore` menggunakan daftar izin: hanya kode, aset publik, dan konfigurasi
build yang dikirim ke builder. Data runtime tidak disalin ke image.
`next.config.ts` juga mengecualikan data lokal dan arsip privat dari output standalone.

`docker-compose.yml` membaca environment dari `.env.local` saat container berjalan
dan memasang `./data` sebagai volume runtime. Konfigurasi privat tidak dimasukkan
ke build context. Siapkan environment yang valid sebelum menjalankan
`docker compose up --build`.
