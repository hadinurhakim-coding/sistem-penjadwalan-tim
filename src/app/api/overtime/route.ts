import { NextResponse } from 'next/server';
import {
  getFullOvertimeData,
  recordOvertimeEvent,
  updateOvertimeEvent,
  deleteOvertimeEvent,
} from '@/lib/overtime-service';

export async function GET() {
  try {
    const data = await getFullOvertimeData();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal mengambil data lembur' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      taskType,
      room,
      date,
      startTime,
      endTime,
      time,
      taskCategory,
      agenda,
      country,
      flightNumber,
      returneesCount,
      assignedMemberIds,
      passMemberIds,
      status,
      notes,
      pdfFileName,
      pdfFileKey,
      pdfFileSize,
      pdfUploadedAt,
    } = body;

    const newEvent = await recordOvertimeEvent({
      title,
      taskType,
      room,
      date,
      startTime,
      endTime,
      time,
      taskCategory,
      agenda,
      country,
      flightNumber,
      returneesCount,
      assignedMemberIds,
      passMemberIds,
      status,
      notes,
      pdfFileName,
      pdfFileKey,
      pdfFileSize,
      pdfUploadedAt,
    });

    const refreshedData = await getFullOvertimeData();

    return NextResponse.json({
      success: true,
      message: 'Event lembur berhasil dicatat dan saldo telah diakumulasikan!',
      event: newEvent,
      data: refreshedData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal mencatat event lembur' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      taskType,
      room,
      date,
      startTime,
      endTime,
      time,
      taskCategory,
      agenda,
      assignedMemberIds,
      status,
      notes,
      pdfFileName,
      pdfFileKey,
      pdfFileSize,
      pdfUploadedAt,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID jadwal wajib disertakan' },
        { status: 400 }
      );
    }

    const updatedEvent = await updateOvertimeEvent({
      id,
      title,
      taskType,
      room,
      date,
      startTime,
      endTime,
      time,
      taskCategory,
      agenda,
      assignedMemberIds,
      status,
      notes,
      pdfFileName,
      pdfFileKey,
      pdfFileSize,
      pdfUploadedAt,
    });

    const refreshedData = await getFullOvertimeData();

    return NextResponse.json({
      success: true,
      message: 'Jadwal kegiatan berhasil diperbarui!',
      event: updatedEvent,
      data: refreshedData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memperbarui jadwal kegiatan' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    let id: string | null = null;
    const url = new URL(request.url);
    id = url.searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id || null;
      } catch {
        // query param was empty, json parse failed
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID jadwal wajib disertakan' },
        { status: 400 }
      );
    }

    await deleteOvertimeEvent(id);
    const refreshedData = await getFullOvertimeData();

    return NextResponse.json({
      success: true,
      message: 'Jadwal kegiatan berhasil dihapus dan saldo personil dihitung ulang!',
      data: refreshedData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menghapus jadwal kegiatan' },
      { status: 400 }
    );
  }
}
