import { NextRequest, NextResponse } from 'next/server';
import { getPresignedPdfUrl, isStorageConfigured } from '@/lib/storage';





export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Parameter "key" berkas tidak disertakan.' },
        { status: 400 }
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
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED' || error?.message?.includes('bail out of prerendering')) {
      throw error;
    }

    console.error('Error saat membuat link unduh PDF:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengakses dokumen PDF di Neon Bucket.' },
      { status: 500 }
    );
  }
}
