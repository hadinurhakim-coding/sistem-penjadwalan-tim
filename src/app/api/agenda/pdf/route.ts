import { NextRequest, NextResponse } from 'next/server';
import { getPresignedPdfUrl, isStorageConfigured } from '@/lib/storage';
import { requireApiAuth } from '@/lib/auth-guard';
import { getOvertimeStore } from '@/lib/overtime-service';

export async function GET(req: NextRequest) {
  // 1. Verifikasi Sesi (F-01)
  const authResult = await requireApiAuth(req);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key || typeof key !== 'string' || key.includes('..') || key.startsWith('/') || key.includes('\\')) {
      return NextResponse.json(
        { success: false, error: 'Parameter "key" berkas tidak valid atau tidak disertakan.' },
        { status: 400 }
      );
    }

    // 2. Verifikasi Kepemilikan Berkas (O-02 Scope Validation):
    // Kunci berkas WAJIB terdaftar pada salah satu jadwal kegiatan yang ada di database.
    const store = await getOvertimeStore();
    const eventMatch = store.events.find((ev) => ev.pdfFileKey === key);
    if (!eventMatch) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dokumen PDF tidak ditemukan atau tidak terafiliasi dengan agenda penugasan yang sah.',
        },
        { status: 404 }
      );
    }

    if (!isStorageConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: 'Neon Object Storage belum dikonfigurasikan di variabel lingkungan (.env.local).',
        },
        { status: 503 }
      );
    }

    // Buat pre-signed URL yang berlaku selama 1 jam (3600 detik)
    const presignedUrl = await getPresignedPdfUrl(key, 3600);

    // Redirect pengguna langsung ke secure pre-signed URL bucket
    return NextResponse.redirect(presignedUrl);
  } catch (error: any) {
    // Biarkan sinyal internal prerender Next.js lewat tanpa tercatat sebagai error
    if (
      error?.digest === 'NEXT_PRERENDER_INTERRUPTED' ||
      error?.message?.includes('bail out of prerendering')
    ) {
      throw error;
    }

    console.error('Error saat membuat link unduh PDF:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengakses dokumen PDF di Neon Bucket.' },
      { status: 500 }
    );
  }
}
