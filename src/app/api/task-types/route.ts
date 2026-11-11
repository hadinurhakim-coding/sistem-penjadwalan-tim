import { NextResponse } from 'next/server';
import {
  getTaskTypes,
  addTaskType,
  updateTaskType,
  deleteTaskType,
} from '@/lib/overtime-service';
import { requireApiAuth, requireApiMutation } from '@/lib/auth-guard';

export async function GET(request: Request) {
  // Verifikasi Sesi (F-01)
  const authResult = await requireApiAuth(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const taskTypes = await getTaskTypes();
    return NextResponse.json({ success: true, data: taskTypes });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal mengambil data jenis tugas' },
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
    const { name, category } = body;
    const created = await addTaskType(name, category || 'Tugas Pokok');
    const taskTypes = await getTaskTypes();
    return NextResponse.json({
      success: true,
      message: 'Jenis tugas berhasil ditambahkan ke database!',
      data: created,
      taskTypes,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menambahkan jenis tugas' },
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
    const { id, name, category } = body;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID jenis tugas wajib disertakan' },
        { status: 400 }
      );
    }
    const updated = await updateTaskType(id, name, category);
    const taskTypes = await getTaskTypes();
    return NextResponse.json({
      success: true,
      message: 'Nama jenis tugas berhasil diperbarui di database!',
      data: updated,
      taskTypes,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memperbarui jenis tugas' },
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
        { success: false, error: 'ID jenis tugas wajib disertakan' },
        { status: 400 }
      );
    }

    await deleteTaskType(id);
    const taskTypes = await getTaskTypes();
    return NextResponse.json({
      success: true,
      message: 'Jenis tugas berhasil dihapus dari database!',
      taskTypes,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menghapus jenis tugas' },
      { status: 400 }
    );
  }
}
