-- ==============================================================
-- SISTEM PENJADWALAN & ROTASI LEMBUR TIM - PLN ICON PLUS
-- Skrip Inisialisasi Database Neon PostgreSQL (penjadwalan-tim)
-- ==============================================================

-- 1. TABEL INTI BETTER AUTH
-- Digunakan oleh Better Auth untuk manajemen sesi dan autentikasi tertutup
CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    "emailVerified" BOOLEAN DEFAULT false NOT NULL,
    image TEXT,
    role TEXT DEFAULT 'admin' NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMPTZ,
    "refreshTokenExpiresAt" TIMESTAMPTZ,
    "scope" TEXT,
    password TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. TABEL ANGGOTA TIM TEKNISI
CREATE TABLE IF NOT EXISTS members (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(100) DEFAULT 'Engineer Multimedia' NOT NULL,
    total_hours NUMERIC(6, 1) DEFAULT 0 NOT NULL,
    total_sessions INTEGER DEFAULT 0 NOT NULL,
    last_overtime_date VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL JADWAL & AGENDA KEGIATAN
-- Mendukung relasi ke file laporan PDF di Neon Object Storage (Bucket uploads)
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date VARCHAR(20) NOT NULL,
    start_time VARCHAR(10),
    end_time VARCHAR(10),
    time VARCHAR(30),
    task_category VARCHAR(50) DEFAULT 'Tugas Pokok' NOT NULL,
    agenda TEXT,
    duration_hours NUMERIC(4, 1) DEFAULT 4 NOT NULL,
    assigned_member_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
    assigned_member_names JSONB DEFAULT '[]'::jsonb NOT NULL,
    status VARCHAR(50) DEFAULT 'Upcoming Session' NOT NULL,
    notes TEXT,
    -- Field Neon Object Storage untuk PDF Laporan
    pdf_file_name TEXT,
    pdf_file_key TEXT,
    pdf_file_size BIGINT,
    pdf_uploaded_at TIMESTAMPTZ,
    room VARCHAR(255),
    task_type VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL JENIS TUGAS DINAMIS
CREATE TABLE IF NOT EXISTS task_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'Tugas Pokok' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL RUANGAN / LOKASI KEGIATAN DINAMIS
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member records must be supplied privately after schema initialization.

-- 6. INITIAL SEED: JENIS TUGAS DEFAULT
INSERT INTO task_types (id, name, category)
VALUES
    ('tt-1', 'Pemeliharaan Studio Multimedia', 'Tugas Pokok'),
    ('tt-2', 'Lembur GR (Gladi Resik)', 'Tugas Pokok'),
    ('tt-3', 'Live Streaming BOD / RUPS', 'Tugas Pokok'),
    ('tt-4', 'Lembur Support Agenda', 'Tugas Support'),
    ('tt-5', 'Bantuan Teknis Vicon Gandul', 'Tugas Support'),
    ('tt-6', 'Standby Insidental Lintas Divisi', 'Tugas Support')
ON CONFLICT (id) DO NOTHING;

-- 7. INITIAL SEED: RUANGAN DEFAULT
INSERT INTO rooms (id, name)
VALUES
    ('rm-1', 'Studio Multimedia Utama'),
    ('rm-2', 'Auditorium PLN Icon Plus'),
    ('rm-3', 'Ruang Rapat Direksi (BOD)'),
    ('rm-4', 'Command Center & NOC'),
    ('rm-5', 'Ruang Vicon Gandul'),
    ('rm-6', 'Meeting Room VIP')
ON CONFLICT (id) DO NOTHING;

-- Migrasi tambahan kolom jika tabel events sudah ada sebelumnya
ALTER TABLE events ADD COLUMN IF NOT EXISTS room VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS task_type VARCHAR(255);
