import { NextResponse } from 'next/server';
import { addTeamMember, updateTeamMember, deleteTeamMember, getFullOvertimeData } from '@/lib/overtime-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, role } = body;

    const newMember = await addTeamMember(name, role);
    const refreshedData = await getFullOvertimeData();

    return NextResponse.json({
      success: true,
      message: `Personil ${newMember.name} berhasil ditambahkan!`,
      member: newMember,
      data: refreshedData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menambahkan personil' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, role } = body;

    const updated = await updateTeamMember(id, name, role);
    const refreshedData = await getFullOvertimeData();

    return NextResponse.json({
      success: true,
      message: `Data personil ${updated.name} berhasil diperbarui!`,
      member: updated,
      data: refreshedData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memperbarui personil' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    await deleteTeamMember(id);
    const refreshedData = await getFullOvertimeData();

    return NextResponse.json({
      success: true,
      message: 'Personil berhasil dihapus!',
      data: refreshedData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menghapus personil' },
      { status: 400 }
    );
  }
}
