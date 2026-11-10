import { NextRequest, NextResponse } from 'next/server';
import { uploadAgendaPdf, isStorageConfigured } from '@/lib/storage';





export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada berkas yang diunggah.' },
        { status: 400 }
      );
    }

    // Validasi format file
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'Hanya berkas dokumen PDF yang diperbolehkan.' },
        { status: 400 }
      );
    }

    // Validasi ukuran (maksimal 15 MB)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Ukuran berkas melebihi batas maksimal 15 MB.' },
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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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
