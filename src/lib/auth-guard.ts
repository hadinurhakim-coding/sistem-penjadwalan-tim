import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from './auth';

export interface AuthSessionResult {
  user: {
    id: string;
    email: string;
    name?: string;
    [key: string]: any;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date | string;
    token: string;
    [key: string]: any;
  };
}

/**
 * Validasi sesi server secara kriptografis menggunakan Better Auth.
 * Digunakan pada Server Components (misal Dashboard page.tsx) atau Route Handlers.
 */
export async function getServerSession(
  reqHeaders?: Headers
): Promise<AuthSessionResult | null> {
  try {
    const h = reqHeaders || (await headers());
    const session = await auth.api.getSession({
      headers: h,
    });
    return (session as unknown as AuthSessionResult) || null;
  } catch (err) {
    console.warn('Gagal memverifikasi sesi Better Auth:', err);
    return null;
  }
}

/**
 * Validasi asal request untuk mencegah serangan CSRF (O-01).
 */
export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host');

  let requestHost = '';
  try {
    requestHost = new URL(request.url).host;
  } catch {
    return false;
  }

  // Jika ada Origin header (dikirim otomatis oleh browser pada request mutasi/POST/PUT/DELETE)
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === requestHost) return true;
      if (host && originHost === host) return true;
      return false;
    } catch {
      return false;
    }
  }

  // Jika tidak ada Origin, periksa Referer
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === requestHost) return true;
      if (host && refererHost === host) return true;
      return false;
    } catch {
      return false;
    }
  }

  // Jika tidak ada Origin dan Referer (misal same-origin internal atau client non-browser terautentikasi)
  return true;
}

/**
 * Guard untuk Route Handler GET:
 * Memastikan sesi valid (F-01). Menolak cookie palsu, token tidak sah, atau sesi revoked.
 */
export async function requireApiAuth(request: Request): Promise<
  | { authorized: true; session: AuthSessionResult; response: null }
  | { authorized: false; session: null; response: NextResponse }
> {
  const session = await getServerSession(request.headers);
  if (!session) {
    return {
      authorized: false,
      session: null,
      response: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Sesi login tidak valid, telah berakhir, atau belum terautentikasi.',
        },
        { status: 401 }
      ),
    };
  }

  return { authorized: true, session, response: null };
}

/**
 * Guard untuk Route Handler Mutasi (POST, PUT, PATCH, DELETE):
 * 1. Verifikasi Sesi (F-01)
 * 2. Verifikasi Origin / Anti-CSRF (O-01)
 * 3. Verifikasi Content-Type: application/json (O-01)
 */
export async function requireApiMutation(
  request: Request,
  options?: { isUpload?: boolean }
): Promise<
  | { authorized: true; session: AuthSessionResult; response: null }
  | { authorized: false; session: null; response: NextResponse }
> {
  // 1. Sesi
  const authResult = await requireApiAuth(request);
  if (!authResult.authorized) {
    return authResult;
  }

  // 2. Anti-CSRF Origin
  if (!isAllowedOrigin(request)) {
    return {
      authorized: false,
      session: null,
      response: NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Permintaan lintas asal (CSRF) ditolak.',
        },
        { status: 403 }
      ),
    };
  }

  // 3. Content-Type Enforce
  if (!options?.isUpload) {
    const contentType = request.headers.get('content-type') || '';
    const method = request.method.toUpperCase();

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (!contentType.toLowerCase().includes('application/json')) {
        return {
          authorized: false,
          session: null,
          response: NextResponse.json(
            {
              success: false,
              error: 'Unsupported Media Type',
              message: 'Header Content-Type wajib berupa application/json.',
            },
            { status: 415 }
          ),
        };
      }
    } else if (method === 'DELETE' && contentType && !contentType.toLowerCase().includes('application/json')) {
      return {
        authorized: false,
        session: null,
        response: NextResponse.json(
          {
            success: false,
            error: 'Unsupported Media Type',
            message: 'Header Content-Type wajib berupa application/json.',
          },
          { status: 415 }
        ),
      };
    }
  }

  return authResult;
}
