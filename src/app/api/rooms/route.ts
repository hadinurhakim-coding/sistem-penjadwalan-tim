import { NextResponse } from 'next/server';
import {
  getRooms,
  addRoom,
  updateRoom,
  deleteRoom,
} from '@/lib/overtime-service';
import { requireApiAuth, requireApiMutation } from '@/lib/auth-guard';

export async function GET(request: Request) {
  // Verifikasi Sesi (F-01)
  const authResult = await requireApiAuth(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const rooms = await getRooms();
    return NextResponse.json({ success: true, data: rooms });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal mengambil data ruangan' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Verifikasi Sesi (F-01), Anti-CSRF & Content-Type (O-01)
  const authResult = await requireApiMutation(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const { name } = body;
    const created = await addRoom(name);
    const rooms = await getRooms();
    return NextResponse.json({
      success: true,
      message: 'Ruangan berhasil ditambahkan ke database!',
      data: created,
      rooms,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menambahkan ruangan' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  // Verifikasi Sesi (F-01), Anti-CSRF & Content-Type (O-01)
  const authResult = await requireApiMutation(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const { id, name } = body;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID ruangan wajib disertakan' },
        { status: 400 }
      );
    }
    const updated = await updateRoom(id, name);
    const rooms = await getRooms();
    return NextResponse.json({
      success: true,
      message: 'Nama ruangan berhasil diperbarui di database!',
      data: updated,
      rooms,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memperbarui ruangan' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  // Verifikasi Sesi (F-01), Anti-CSRF & Content-Type (O-01)
  const authResult = await requireApiMutation(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    let id: string | null = null;
    const url = new URL(request.url);
    id = url.searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id || null;
      } catch {}
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID ruangan wajib disertakan' },
        { status: 400 }
      );
    }

    await deleteRoom(id);
    const rooms = await getRooms();
    return NextResponse.json({
      success: true,
      message: 'Ruangan berhasil dihapus dari database!',
      rooms,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menghapus ruangan' },
      { status: 400 }
    );
  }
}
