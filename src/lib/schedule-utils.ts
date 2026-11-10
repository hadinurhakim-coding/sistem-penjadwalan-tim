import { OvertimeEvent, EventStatus } from '@/types/overtime';

/**
 * Menentukan apakah jadwal suatu agenda sudah terlewat (waktu pelaksanaannya telah usai).
 * Mengacu pada tanggal dan jam selesai (endTime).
 */
export function isEventSchedulePast(event: {
  date: string;
  startTime?: string;
  endTime?: string;
  time?: string;
}): boolean {
  if (!event || !event.date) return false;

  const now = new Date();

  let startHour = 17;
  let endHour = 21;
  let endMinute = 0;

  // 1. Ekstrak start time jika ada
  if (event.startTime && event.startTime.includes(':')) {
    const [sh] = event.startTime.split(':').map((v) => parseInt(v, 10));
    if (!isNaN(sh)) startHour = sh;
  }

  // 2. Ekstrak end time
  if (event.endTime && event.endTime.includes(':')) {
    const [h, m] = event.endTime.split(':').map((v) => parseInt(v, 10));
    if (!isNaN(h)) endHour = h;
    if (!isNaN(m)) endMinute = m;
  } else if (event.time && event.time.includes('-')) {
    const parts = event.time.split('-');
    const endPart = parts[1]?.trim()?.split(' ')[0];
    if (endPart && endPart.includes(':')) {
      const [h, m] = endPart.split(':').map((v) => parseInt(v, 10));
      if (!isNaN(h)) endHour = h;
      if (!isNaN(m)) endMinute = m;
    }
  }

  // 3. Parse tanggal kegiatan (Format: YYYY-MM-DD)
  const dateParts = event.date.split('-');
  if (dateParts.length !== 3) {
    const d = new Date(event.date);
    d.setHours(endHour, endMinute, 0, 0);
    return now.getTime() >= d.getTime();
  }

  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;
  let day = parseInt(dateParts[2], 10);

  // Jika shift lintas hari / tengah malam (misal 22:00 - 02:00)
  if (endHour < startHour) {
    day += 1;
  }

  const eventEndDateTime = new Date(year, month, day, endHour, endMinute, 0, 0);
  return now.getTime() >= eventEndDateTime.getTime();
}

/**
 * Aturan Penentuan Status Efektif Agenda:
 * 1. Jika status agenda sudah 'Batal', maka status TETAP 'Batal'.
 * 2. Jika jadwal agenda sudah terlewat dan bukan 'Batal', maka status OTOMATIS menjadi 'Selesai'.
 * 3. Jika jadwal belum terlewat, maka status tetap sesuai status aslinya (default: 'Terjadwal').
 */
export function getEffectiveEventStatus(event: {
  date: string;
  startTime?: string;
  endTime?: string;
  time?: string;
  status?: EventStatus | string;
}): EventStatus {
  if (event.status === 'Batal') {
    return 'Batal';
  }

  if (isEventSchedulePast(event)) {
    return 'Selesai';
  }

  if (event.status === 'Berubah') {
    return 'Berubah';
  }

  if (event.status === 'Completed' || event.status === 'Selesai') {
    return 'Selesai';
  }

  return (event.status as EventStatus) || 'Terjadwal';
}
