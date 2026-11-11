import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cek cookie session Better Auth
  const sessionCookie =
    request.cookies.get('better-auth.session_token') ||
    request.cookies.get('__Secure-better-auth.session_token');

  const isAuthenticated = Boolean(sessionCookie?.value);

  // Jika pengguna sudah login dan mencoba mengakses /login -> arahkan ke dashboard utama
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Jika belum login dan mengakses halaman yang diproteksi -> arahkan ke /login
  if (!isAuthenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Sesi login tidak valid atau telah berakhir.' },
        { status: 401 }
      );
    }

    // Redirect ke login untuk halaman web
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Cocokkan semua path kecuali:
     * - /api/auth/* (Endpoint Better Auth)
     * - /_next/static (Berkas statis Next.js)
     * - /_next/image (Optimasi gambar)
     * - favicon.ico, gambar, font (*.svg, *.png, *.jpg, *.ico, dll.)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
