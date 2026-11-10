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

/**
 * Format teks penugasan untuk dibagikan di WhatsApp Group (WAG Lembur)
 * Sesuai format standar:
 * Nama : Hadi, Ari, Alfen
 * Tanggal : 9 November 2026
 * Jam Mulai : 17.00
 * Jam Selesai : 21.00
 * Kegiatan : GR Agenda Colony Insight 2026
 *
 *
 * Catatan : -
 */
export function generateWAGBroadcastText(event: OvertimeEvent): string {
  // 1. Nama teknisi yang ditugaskan
  const names =
    event.assignedMemberNames && event.assignedMemberNames.length > 0
      ? event.assignedMemberNames.join(', ')
      : '-';

  // 2. Format tanggal bahasa Indonesia (contoh: 9 November 2026)
  let formattedDate = event.date;
  try {
    const [y, m, d] = event.date.split('-').map(Number);
    if (y && m && d) {
      const monthNamesIndo = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      formattedDate = `${d} ${monthNamesIndo[m - 1]} ${y}`;
    } else {
      const dateObj = new Date(event.date + (event.date.includes('T') ? '' : 'T00:00:00'));
      formattedDate = dateObj.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  } catch {
    formattedDate = event.date;
  }

  // 3. Jam Mulai dan Jam Selesai (format titik khas WhatsApp: 17.00 & 21.00)
  let start = event.startTime || '';
  let end = event.endTime || '';

  if ((!start || !end) && event.time && event.time.includes('-')) {
    const parts = event.time.split('-');
    if (parts.length === 2) {
      if (!start) start = parts[0].trim();
      if (!end) end = parts[1].trim().split(' ')[0];
    }
  }

  start = start || '17:00';
  end = end || '21:00';

  const formattedStart = start.replace(':', '.');
  const formattedEnd = end.replace(':', '.');

  // 4. Kegiatan / Judul acara
  const kegiatan = event.title || event.agenda || '-';

  // Format baku sesuai permintaan user
  return `Nama : ${names}
Tanggal : ${formattedDate}
Jam Mulai : ${formattedStart}
Jam Selesai : ${formattedEnd}
Kegiatan : ${kegiatan}


Catatan : -`;
}

/**
 * Salin teks ke clipboard secara cross-browser (Desktop & Mobile iOS/Android)
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    textArea.remove();
    return successful;
  } catch (err) {
    console.error('Clipboard copy error:', err);
    return false;
  }
}
