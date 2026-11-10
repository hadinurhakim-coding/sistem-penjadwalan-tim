import { Pool, neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ PERINGATAN: DATABASE_URL belum dikonfigurasi di environment production.');
}

// Pool koneksi PostgreSQL untuk Better Auth dan query database
export const pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : null;

// Neon HTTP query runner untuk serverless execution cepat
export const sql = databaseUrl
  ? neon(databaseUrl)
  : null;
