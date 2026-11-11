import { betterAuth } from 'better-auth';
import { pool } from './db';

export const auth = betterAuth({
  database: pool ? pool : undefined,
  emailAndPassword: {
    enabled: true,
    // SISTEM 1 PINTU DI NEON SAJA:
    // Pendaftaran akun melalui API publik/halaman web dinonaktifkan secara total.
    // Akun HANYA dapat didaftarkan langsung oleh Administrator melalui Neon DB Console
    // atau skrip offline scripts/create-neon-user.mjs.
    // Better Auth 1.7.19 menggunakan disableSignUp: true
    disableSignUp: true,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // Sesi berlaku 7 hari
    updateAge: 60 * 60 * 24, // Perbarui cookie setiap 24 jam
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 menit cache cookie untuk efisiensi Edge
    },
  },
});
