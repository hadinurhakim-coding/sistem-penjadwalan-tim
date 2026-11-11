import { NextRequest, NextResponse } from 'next/server';
import { uploadAgendaPdf, isStorageConfigured } from '@/lib/storage';
import { requireApiMutation } from '@/lib/auth-guard';

const PDF_MAGIC_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // '%PDF-'
const MAX_SIZE = 15 * 1024 * 1024; // 15 MB

export async function POST(req: NextRequest) {
  // 1. Verifikasi Sesi & Anti-CSRF (F-01, O-01)
  const authResult = await requireApiMutation(req, { isUpload: true });
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada berkas yang diunggah.' },
        { status: 400 }
      );
    }

    // 2. Validasi Ekstensi Berkas (Harus berakhiran .pdf)
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'Hanya berkas dengan ekstensi .pdf yang diperbolehkan.' },
        { status: 400 }
      );
    }

    // 3. Validasi MIME Type Berkas
    if (file.type && file.type !== 'application/pdf' && file.type !== 'application/x-pdf') {
      return NextResponse.json(
        { success: false, error: 'MIME type berkas harus berupa application/pdf.' },
        { status: 400 }
      );
    }

    // 4. Validasi Ukuran Berkas (Maksimal 15 MB)
    if (file.size > MAX_SIZE || file.size <= 0) {
      return NextResponse.json(
        { success: false, error: 'Ukuran berkas melebihi batas maksimal 15 MB atau berkas kosong.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Validasi Magic Bytes Dokumen Asli PDF (%PDF-) (F-04)
    // Berkas PDF valid harus diawali dengan header signature '%PDF-'
    if (buffer.length < 5 || !buffer.subarray(0, 5).equals(PDF_MAGIC_BYTES)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format berkas tidak valid. Berkas harus berupa dokumen PDF asli (magic bytes %PDF- tidak cocok).',
        },
        { status: 400 }
      );
    }

    // Jika kredensial storage belum dipasang di .env.local (pengembangan lokal tanpa bucket)
    if (!isStorageConfigured) {
      console.warn('Neon Storage belum diatur. Mengembalikan simulasi upload lokal.');
      return NextResponse.json({
        success: true,
        file: {
          key: `local-simulated/${Date.now()}_${file.name}`,
          fileName: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        },
        notice: 'Kredensial Neon Storage belum aktif di .env.local. File disimulasikan.',
      });
    }

    const uploaded = await uploadAgendaPdf({
      buffer,
      fileName: file.name,
      contentType: 'application/pdf',
    });

    return NextResponse.json({
      success: true,
      file: {
        key: uploaded.key,
        fileName: uploaded.fileName,
        size: uploaded.size,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error saat upload PDF laporan agenda:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengunggah berkas PDF ke Neon Storage.' },
      { status: 500 }
    );
  }
}
