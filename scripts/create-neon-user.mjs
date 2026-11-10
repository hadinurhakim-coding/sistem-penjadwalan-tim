/**
 * Utility Script: Mendaftarkan Akun Baru Langsung ke Neon DB (Sistem 1 Pintu)
 * 
 * Penggunaan:
 *   node scripts/create-neon-user.mjs <email> <password> "<nama_lengkap>"
 * 
 * Contoh:
 *   Gunakan alamat dan kata sandi akun dari konfigurasi privat administrator.
 */

import { Pool } from '@neondatabase/serverless';
import { betterAuth } from 'better-auth';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Baca file .env.local atau .env jika ada
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const fullPath = resolve(process.cwd(), file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf-8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            let val = trimmed.slice(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  }
}

loadEnv();

const dbUrl = process.env.DATABASE_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || 'Admin Teknisi';

if (!email || !password) {
  console.log('\n📌 Petunjuk Penggunaan Pembuatan Akun 1 Pintu Neon:');
  console.log('  node scripts/create-neon-user.mjs <email> <password> "<nama_lengkap>"\n');
  console.log('Contoh:');
  console.log('  Gunakan alamat dan kata sandi akun dari konfigurasi privat administrator.\n');
  process.exit(1);
}

if (!dbUrl) {
  console.error('\n❌ EROR: DATABASE_URL tidak ditemukan.');
  console.error('Pastikan Anda sudah mengisi DATABASE_URL di file .env.local');
  console.error('Gunakan connection string privat dari provider database.\n');
  process.exit(1);
}

if (!authSecret || authSecret.length < 32) {
  console.error('BETTER_AUTH_SECRET wajib diisi dengan secret acak minimal 32 karakter.');
  process.exit(1);
}

async function run() {
  console.log(`\n⏳ Menghubungkan ke Neon PostgreSQL untuk mendaftarkan user: ${email}...`);

  try {
    const pool = new Pool({ connectionString: dbUrl });
    const auth = betterAuth({
      database: pool,
      emailAndPassword: {
        enabled: true,
      },
      secret: authSecret,
    });

    const res = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    console.log(`\n✅ BERHASIL! Akun "${name}" (${email}) berhasil didaftarkan langsung ke Neon DB.`);
    console.log(`ID User: ${res?.user?.id || 'OK'}`);
    console.log('Status: Aktif & siap digunakan untuk login di /login.\n');
    await pool.end();
  } catch (err) {
    console.error('\n❌ Gagal membuat user:', err?.message || err);
  }
}

run();
