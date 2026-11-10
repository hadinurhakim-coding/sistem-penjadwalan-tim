# sistem-penjadwalan-tim

Sistem Penjadwalan & Rotasi Lembur Tim - Aplikasi penjadwalan dan pencatatan lembur tim berbasis Next.js App Router, Tailwind CSS, Neon Serverless Postgres, Better Auth (Sistem 1 Pintu), dan Neon Object Storage.

---

## ⚡ Quick Setup with AI Coding Agent (Prompt Siap Pakai)

Jika Anda meng-clone repositori ini dan menggunakan AI Coding Agent (**Google Antigravity**, **Claude Code**, **Cursor**, **Codex**, dsb.), Anda cukup **menyalin dan menempelkan prompt di bawah ini** langsung ke chat/terminal agen AI Anda untuk mengotomatiskan seluruh konfigurasi dari awal sampai siap jalan:

### 📋 Salin Prompt Ini ke AI Agent Anda:

```text
Tolong siapkan dan konfigurasikan repositori 'sistem-penjadwalan-tim' ini secara menyeluruh dari awal:

1. DEPENDENSI: Pasang paket dependensi proyek menggunakan pnpm (`pnpm install --frozen-lockfile`) atau npm (`npm install`).
2. NEON SERVERLESS SETUP:
   Proyek ini menggunakan arsitektur Neon Serverless yang dideklarasikan di `neon.ts` (Postgres, Better Auth sistem tertutup 1-pintu, Object Storage bucket 'uploads' private, dan Realtime).
   - Pastikan Neon CLI tersedia (gunakan `npx neon@latest`).
   - Tautkan atau inisialisasi proyek ke akun Neon saya dengan menjalankan `npx neon@latest init` (atau `npx neon@latest init -s postgres -s auth -s object-storage -s realtime`).
   - Jalankan `npx neon@latest deploy` untuk memprovisi layanan dan menarik variabel lingkungan ke `.env.local`.
3. VARIABEL LINGKUNGAN (.env.local):
   Pastikan berkas `.env.local` memiliki variabel berikut (merujuk ke `.env.example`):
   - `DATABASE_URL` & `DATABASE_URL_UNPOOLED`
   - `BETTER_AUTH_SECRET` (generate string acak 32+ karakter aman jika belum ada)
   - `BETTER_AUTH_URL="http://localhost:3000"`
   - `NEXT_PUBLIC_APP_URL="http://localhost:3000"`
   - Kredensial S3 Neon Object Storage (`AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, dan `NEON_STORAGE_BUCKET="uploads"`).
4. MIGRASI BASIS DATA:
   Jalankan migrasi skema tabel ke Neon Postgres menggunakan skrip:
   `node scripts/run-migration.mjs`
   (Skema DDL lengkap ada di `scripts/init-neon-db.sql`).
5. PEMBUATAN AKUN ADMINISTRATOR PERTAMA (Sistem 1 Pintu):
   Karena pendaftaran publik di web dinonaktifkan (`signUp: { enabled: false }`), daftarkan akun admin pertama langsung ke Neon DB menggunakan skrip:
   `node scripts/create-neon-user.mjs admin@example.com PasswordKuat123! "Nama Administrator"`
6. VERIFIKASI & PENGUJIAN:
   - Jalankan `node scripts/test-services.mjs` untuk memverifikasi 4 layanan Neon berfungsi end-to-end.
   - Jalankan `npm run build` untuk memastikan build Next.js sukses tanpa error TypeScript/Turbopack.
7. SELESAI:
   Mulai aplikasi dengan `npm run dev` dan laporkan detail akun admin serta URL login (http://localhost:3000/login).
```

<details>
<summary>🇬🇧 <strong>Click to view English version of this prompt</strong></summary>

```text
Please set up and configure this 'sistem-penjadwalan-tim' repository from scratch:

1. DEPENDENCIES: Install project dependencies using pnpm (`pnpm install --frozen-lockfile`) or npm (`npm install`).
2. NEON SERVERLESS SETUP:
   This project uses Neon Serverless primitives declared in `neon.ts` (Postgres, Better Auth closed 1-door registration, Object Storage private bucket 'uploads', and Realtime).
   - Use Neon CLI via `npx neon@latest`.
   - Link or initialize a project in my Neon organization by running `npx neon@latest init` (services: postgres, auth, object-storage, realtime).
   - Run `npx neon@latest deploy` to provision services and pull environment variables into `.env.local`.
3. ENVIRONMENT VARIABLES (.env.local):
   Ensure `.env.local` contains (see `.env.example` for reference):
   - `DATABASE_URL` & `DATABASE_URL_UNPOOLED`
   - `BETTER_AUTH_SECRET` (generate random 32+ char hex secret if missing)
   - `BETTER_AUTH_URL="http://localhost:3000"`
   - `NEXT_PUBLIC_APP_URL="http://localhost:3000"`
   - Neon S3 credentials (`AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `NEON_STORAGE_BUCKET="uploads"`).
4. DATABASE MIGRATION:
   Run the database migration against Neon Postgres:
   `node scripts/run-migration.mjs`
   (Full DDL schema is located in `scripts/init-neon-db.sql`).
5. INITIAL ADMIN ACCOUNT (1-Door Registration):
   Public signup is completely disabled for security. Create the first admin user directly into Neon DB:
   `node scripts/create-neon-user.mjs admin@example.com StrongPassword123! "Administrator Name"`
6. VERIFICATION & TEST:
   - Run `node scripts/test-services.mjs` to verify all 4 Neon services end-to-end.
   - Run `npm run build` to confirm Next.js build passes cleanly.
7. FINISH:
   Start the dev server with `npm run dev` and report the admin credentials and login URL (http://localhost:3000/login).
```
</details>

---

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
