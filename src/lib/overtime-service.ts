import fs from 'fs/promises';
import path from 'path';
import { sql } from './db';
import { getEffectiveEventStatus } from '@/lib/schedule-utils';
import {
  Member,
  OvertimeEvent,
  OvertimeStore,
  RankedMember,
  FairnessMetrics,
  OvertimeApiResponse,
  PriorityStatus,
  TaskCategory,
  TaskType,
  Room,
  EventStatus,
  TechnicianRoles,
} from '@/types/overtime';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'overtime_store.json');

export const DEFAULT_TASK_TYPES: TaskType[] = [
  { id: 'tt-1', name: 'Pemeliharaan Studio Multimedia', category: 'Tugas Pokok' },
  { id: 'tt-2', name: 'Lembur GR (Gladi Resik)', category: 'Tugas Pokok' },
  { id: 'tt-3', name: 'Live Streaming BOD / RUPS', category: 'Tugas Pokok' },
  { id: 'tt-4', name: 'Lembur Support Agenda', category: 'Tugas Support' },
  { id: 'tt-5', name: 'Bantuan Teknis Vicon Gandul', category: 'Tugas Support' },
  { id: 'tt-6', name: 'Standby Insidental Lintas Divisi', category: 'Tugas Support' },
];

export const DEFAULT_ROOMS: Room[] = [
  { id: 'rm-1', name: 'Studio Multimedia Utama' },
  { id: 'rm-2', name: 'Auditorium PLN Icon Plus' },
  { id: 'rm-3', name: 'Ruang Rapat Direksi (BOD)' },
  { id: 'rm-4', name: 'Command Center & NOC' },
  { id: 'rm-5', name: 'Ruang Vicon Gandul' },
  { id: 'rm-6', name: 'Meeting Room VIP' },
];

// Personal member records belong in private runtime storage, never in source code.
const DEFAULT_MEMBERS: Member[] = [];

const DEFAULT_STORE: OvertimeStore = {
  members: DEFAULT_MEMBERS,
  events: [],
  taskTypes: DEFAULT_TASK_TYPES,
  rooms: DEFAULT_ROOMS,
};

// Map row database Neon Postgres ke OvertimeEvent
function mapRowToEvent(row: any): OvertimeEvent {
  const rawStatus = row.status || 'Upcoming Session';
  const effectiveStatus = getEffectiveEventStatus({
    date: row.date,
    startTime: row.start_time || undefined,
    endTime: row.end_time || undefined,
    time: row.time || undefined,
    status: rawStatus,
  });

  return {
    id: row.id,
    title: row.title,
    date: row.date,
    startTime: row.start_time || undefined,
    endTime: row.end_time || undefined,
    time: row.time || undefined,
    taskCategory: (row.task_category || 'Tugas Pokok') as TaskCategory,
    taskType: row.task_type || undefined,
    room: row.room || undefined,
    agenda: row.agenda || undefined,
    durationHours: Number(row.duration_hours) || 4,
    assignedMemberIds:
      typeof row.assigned_member_ids === 'string'
        ? JSON.parse(row.assigned_member_ids)
        : row.assigned_member_ids || [],
    assignedMemberNames:
      typeof row.assigned_member_names === 'string'
        ? JSON.parse(row.assigned_member_names)
        : row.assigned_member_names || [],
    status: effectiveStatus,
    technicianRoles: row.technician_roles
      ? typeof row.technician_roles === 'string'
        ? JSON.parse(row.technician_roles)
        : row.technician_roles
      : undefined,
    notes: row.notes || undefined,
    pdfFileName: row.pdf_file_name || undefined,
    pdfFileKey: row.pdf_file_key || undefined,
    pdfFileSize: row.pdf_file_size ? Number(row.pdf_file_size) : undefined,
    pdfUploadedAt: row.pdf_uploaded_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

let schemaInitialized = false;
export async function ensureSchemaInitialized(): Promise<void> {
  if (schemaInitialized || !sql) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS room VARCHAR(255)`;
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS task_type VARCHAR(255)`;
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS technician_roles JSONB DEFAULT '{}'::jsonb`;
    schemaInitialized = true;
  } catch (err) {
    console.warn('Inisialisasi schema Neon warning:', err);
  }
}

// Helper: Ensure storage exists and read data (Neon Postgres atau Fallback Lokal) - Murni Read-Only (O-03)
export async function getOvertimeStore(): Promise<OvertimeStore> {
  if (sql) {
    try {
      const [membersRows, eventsRows, taskTypesRows, roomsRows] = await Promise.all([
        sql`SELECT * FROM members ORDER BY id ASC`,
        sql`SELECT * FROM events ORDER BY date ASC, start_time ASC`,
        sql`SELECT * FROM task_types ORDER BY id ASC`,
        sql`SELECT * FROM rooms ORDER BY id ASC`.catch(() => []),
      ]);

      const members: Member[] = membersRows.map((r: any) => ({
        id: String(r.id),
        name: r.name,
        email: r.email || undefined,
        role: r.role || 'Engineer Multimedia',
        totalHours: Number(r.total_hours) || 0,
        totalSessions: Number(r.total_sessions) || 0,
        lastOvertimeDate: r.last_overtime_date || null,
        createdAt: r.created_at || new Date().toISOString(),
      }));

      const events: OvertimeEvent[] = eventsRows.map(mapRowToEvent);

      const taskTypes: TaskType[] = taskTypesRows.map((r: any) => ({
        id: String(r.id),
        name: r.name,
        category: (r.category || 'Tugas Pokok') as TaskCategory,
        createdAt: r.created_at || undefined,
        updatedAt: r.updated_at || undefined,
      }));

      const rooms: Room[] = Array.isArray(roomsRows)
        ? roomsRows.map((r: any) => ({
            id: String(r.id),
            name: r.name,
            createdAt: r.created_at || undefined,
            updatedAt: r.updated_at || undefined,
          }))
        : DEFAULT_ROOMS;

      return {
        members: members.length > 0 ? members : DEFAULT_MEMBERS,
        events,
        taskTypes: taskTypes.length > 0 ? taskTypes : DEFAULT_TASK_TYPES,
        rooms,
      };
    } catch (dbErr) {
      console.warn('Neon Postgres query gagal, beralih ke cache lokal fallback:', dbErr);
    }
  }

  // Fallback Local File Storage
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(fileContent);
    const taskTypes = Array.isArray(parsed.taskTypes) ? parsed.taskTypes : [...DEFAULT_TASK_TYPES];
    const rooms = Array.isArray(parsed.rooms) ? parsed.rooms : [...DEFAULT_ROOMS];
    const rawEvents: OvertimeEvent[] = Array.isArray(parsed.events) ? parsed.events : [];
    const events: OvertimeEvent[] = rawEvents.map((ev) => ({
      ...ev,
      status: getEffectiveEventStatus(ev),
    }));
    return {
      members: parsed.members || DEFAULT_MEMBERS,
      events,
      taskTypes,
      rooms,
    };
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      try {
        await saveOvertimeStore(DEFAULT_STORE);
      } catch {}
      return DEFAULT_STORE;
    }
    return DEFAULT_STORE;
  }
}

// Helper: Save data to JSON file fallback
export async function saveOvertimeStore(store: OvertimeStore): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    // Di Vercel environment, penulisan fs diabaikan jika read-only
    console.warn('Peringatan penulisan filesystem (biasa di Vercel read-only):', err);
  }
}

// Helper to detect if an event/task is considered Overtime ("Lembur" or "GR / Gladi Resik")
// ATURAN: Jika Jenis Tugas bukan Lembur (misal: "Support Agenda", "Pemeliharaan Studio"), maka TIDAK TERMASUK ke jumlah jam data tabel lembur!
export function isOvertimeEvent(
  eventOrTitle: Partial<OvertimeEvent> | { taskType?: string; title?: string } | string
): boolean {
  if (typeof eventOrTitle === 'string') {
    return /lembur|gladi\s*resik|\bgr\b/i.test(eventOrTitle);
  }
  // 1. Acuan Utama: taskType (Jenis Tugas)
  const taskType = eventOrTitle?.taskType;
  if (taskType) {
    return /lembur|gladi\s*resik|\bgr\b/i.test(taskType);
  }
  // 2. Acuan Sekunder: jika taskType belum tercatat, cek title
  const title = eventOrTitle?.title || '';
  return /lembur|gladi\s*resik|\bgr\b/i.test(title);
}

// Backward-compatible alias
export const isGREvent = isOvertimeEvent;

// Calculate priority ranking strictly by:
// 1. totalHours ASC (terendah paling berhak)
// 2. totalSessions ASC
// 3. lastOvertimeDate ASC (null/never overtimed first, then oldest date first)
// 4. name ASC (stable secondary tiebreaker)
export function computeRankedMembers(members: Member[]): RankedMember[] {
  const sorted = [...members].sort((a, b) => {
    if (a.totalHours !== b.totalHours) {
      return a.totalHours - b.totalHours;
    }
    if (a.totalSessions !== b.totalSessions) {
      return a.totalSessions - b.totalSessions;
    }
    if (a.lastOvertimeDate === null && b.lastOvertimeDate !== null) return -1;
    if (a.lastOvertimeDate !== null && b.lastOvertimeDate === null) return 1;
    if (a.lastOvertimeDate && b.lastOvertimeDate) {
      if (a.lastOvertimeDate !== b.lastOvertimeDate) {
        return a.lastOvertimeDate.localeCompare(b.lastOvertimeDate);
      }
    }
    return a.name.localeCompare(b.name);
  });

  return sorted.map((member, index) => {
    let statusLabel: PriorityStatus = 'Antrean';
    if (index === 0 || index === 1) {
      statusLabel = 'Kandidat Utama';
    } else if (index === 2) {
      statusLabel = 'Cadangan 1';
    } else if (index === 3) {
      statusLabel = 'Cadangan 2';
    }

    let reasoning = `Total ${member.totalHours} Jam (${index === 0 ? 'Paling Sedikit' : 'Prioritas ' + (index + 1)})`;
    if (member.lastOvertimeDate) {
      reasoning += ` • Terakhir: ${member.lastOvertimeDate}`;
    } else {
      reasoning += ` • Belum pernah lembur`;
    }

    return {
      ...member,
      rank: index + 1,
      statusLabel,
      reasoning,
    };
  });
}

// Calculate mathematical fairness metrics
export function computeFairnessMetrics(members: Member[], events: OvertimeEvent[]): FairnessMetrics {
  const activeMembersCount = members.length;
  const hoursArray = members.map((m) => m.totalHours);
  const totalDistributedHours = hoursArray.reduce((acc, h) => acc + h, 0);

  const maxHours = hoursArray.length > 0 ? Math.max(...hoursArray) : 0;
  const minHours = hoursArray.length > 0 ? Math.min(...hoursArray) : 0;
  const maxDiffHours = Math.round((maxHours - minHours) * 10) / 10;

  let fairnessRating: FairnessMetrics['fairnessRating'] = 'Keadilan Sempurna';
  let fairnessColor = '#005596';

  if (maxDiffHours > 8) {
    fairnessRating = 'Perlu Penyeimbangan';
    fairnessColor = '#DC2626';
  } else if (maxDiffHours > 4) {
    fairnessRating = 'Wajar';
    fairnessColor = '#D97706';
  } else if (maxDiffHours > 0) {
    fairnessRating = 'Sangat Seimbang';
    fairnessColor = '#059669';
  }

  return {
    totalMembers: activeMembersCount,
    totalDistributedHours,
    totalEvents: events.length,
    maxDiffHours,
    minHours,
    maxHours,
    fairnessRating,
    fairnessColor,
  };
}

// Get full response for the dashboard
export async function getFullOvertimeData(): Promise<OvertimeApiResponse> {
  const store = await getOvertimeStore();
  const rankedMembers = computeRankedMembers(store.members);
  const metrics = computeFairnessMetrics(store.members, store.events);

  return {
    members: store.members,
    rankedMembers,
    topCandidates: rankedMembers.slice(0, 2),
    backupCandidates: rankedMembers.slice(2, 4),
    events: store.events.map((ev) => ({
      ...ev,
      status: getEffectiveEventStatus(ev),
    })),
    metrics,
    taskTypes: store.taskTypes || DEFAULT_TASK_TYPES,
    rooms: store.rooms || DEFAULT_ROOMS,
  };
}

// ==========================================
// Strict Input Validators (F-03 API Integrity)
// ==========================================

export function isValidDateString(dateStr: unknown): dateStr is string {
  if (typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (year < 2020 || year > 2050 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

export function isValidTimeString(timeStr: unknown): timeStr is string {
  if (typeof timeStr !== 'string') return false;
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(timeStr);
}

export function calculateAndValidateDuration(
  startTime?: string,
  endTime?: string,
  fallback = 4
): number {
  if (!startTime || !endTime) return fallback;
  if (!isValidTimeString(startTime) || !isValidTimeString(endTime)) {
    throw new Error('Format jam mulai atau jam selesai tidak valid. Gunakan format HH:mm (contoh: 17:00).');
  }

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const diffMinutes = endMinutes - startMinutes;
  if (diffMinutes <= 0) {
    throw new Error('Jam selesai harus lebih akhir daripada jam mulai pada tanggal yang sama.');
  }

  const hours = Math.round((diffMinutes / 60) * 10) / 10;
  if (hours < 0.25 || hours > 24) {
    throw new Error('Durasi kegiatan harus antara 15 menit (0.25 jam) dan maksimal 24 jam.');
  }

  return hours;
}

export function validateAssignedMembers(
  memberIds: unknown,
  existingMembers: Member[],
  isOvertime: boolean
): string[] {
  if (!Array.isArray(memberIds)) {
    if (isOvertime) {
      throw new Error('Untuk kegiatan lembur, wajib memilih personil teknisi yang bertugas.');
    }
    return [];
  }

  // Deduplikasi ID personil
  const uniqueIds = Array.from(new Set(memberIds.map(String).map((s) => s.trim()))).filter(Boolean);
  const existingSet = new Set(existingMembers.map((m) => m.id));

  // Hanya terima ID yang memang terdaftar di tabel personil
  const validIds = uniqueIds.filter((id) => existingSet.has(id));

  if (isOvertime && validIds.length === 0) {
    throw new Error('Personil teknisi yang dipilih tidak valid atau belum terdaftar.');
  }

  return validIds;
}

const VALID_CATEGORIES = new Set<TaskCategory>(['Tugas Pokok', 'Tugas Support']);
const VALID_STATUSES = new Set<EventStatus>([
  'Terjadwal',
  'Selesai',
  'Berubah',
  'Batal',
  'Upcoming Session',
  'In Progress',
  'Completed',
]);

export function validateTaskCategory(category?: unknown): TaskCategory {
  if (!category) return 'Tugas Pokok';
  if (VALID_CATEGORIES.has(category as TaskCategory)) {
    return category as TaskCategory;
  }
  return 'Tugas Pokok';
}

export function validateEventStatus(status?: unknown): EventStatus {
  if (!status) return 'Terjadwal';
  if (VALID_STATUSES.has(status as EventStatus)) {
    return status as EventStatus;
  }
  return 'Terjadwal';
}

export function validateTitle(title: unknown): string {
  if (typeof title !== 'string' || !title.trim()) {
    throw new Error('Nama kegiatan/judul agenda wajib diisi.');
  }
  const trimmed = title.trim();
  if (trimmed.length < 2) {
    throw new Error('Nama kegiatan minimal 2 karakter.');
  }
  if (trimmed.length > 200) {
    throw new Error('Nama kegiatan maksimal 200 karakter.');
  }
  return trimmed;
}

export function validatePdfMetadata(
  pdfFileKey?: string,
  pdfFileSize?: number
): { pdfFileKey?: string; pdfFileSize?: number } {
  if (pdfFileSize !== undefined && pdfFileSize !== null) {
    if (
      typeof pdfFileSize !== 'number' ||
      isNaN(pdfFileSize) ||
      pdfFileSize < 0 ||
      pdfFileSize > 15 * 1024 * 1024
    ) {
      throw new Error('Ukuran file PDF tidak valid atau melebihi batas maksimal 15 MB.');
    }
  }
  if (pdfFileKey !== undefined && pdfFileKey !== null) {
    if (
      typeof pdfFileKey !== 'string' ||
      pdfFileKey.includes('..') ||
      pdfFileKey.startsWith('/') ||
      pdfFileKey.includes('\\')
    ) {
      throw new Error('Kunci file PDF (file key) tidak valid.');
    }
  }
  return {
    pdfFileKey: pdfFileKey || undefined,
    pdfFileSize:
      pdfFileSize !== undefined && pdfFileSize !== null ? Number(pdfFileSize) : undefined,
  };
}

// Recalculate member total hours, sessions, and last overtime date
// NOTE: Per requirement, any task containing "Lembur" or "GR (Gladi Resik)" counts towards overtime balance & fair queue!
// ATURAN: Jika status agenda "Batal", maka penugasan TIDAK dihitung ke jam lembur.
export function recalculateMemberTotals(store: OvertimeStore) {
  const memberMap: Record<string, { hours: number; sessions: number; lastDate: string | null }> = {};
  for (const m of store.members) {
    memberMap[m.id] = { hours: 0, sessions: 0, lastDate: null };
  }
  for (const ev of store.events) {
    // Agenda yang berstatus 'Batal' (dibatalkan) tidak dihitung ke akumulasi jam lembur
    if (ev.status === 'Batal') {
      continue;
    }

    // Setiap kegiatan dengan kata "Lembur" atau "GR (Gladi Resik)" dihitung ke akumulasi jam lembur
    if (!isOvertimeEvent(ev)) {
      continue;
    }

    const dur = ev.durationHours || 4;
    // Deduplikasi personil per event agar tidak menggandakan jam teknisi (F-03)
    const uniqueMemberIds = Array.from(new Set(ev.assignedMemberIds || []));
    for (const memId of uniqueMemberIds) {
      if (memberMap[memId]) {
        memberMap[memId].hours += dur;
        memberMap[memId].sessions += 1;
        if (!memberMap[memId].lastDate || ev.date > memberMap[memId].lastDate!) {
          memberMap[memId].lastDate = ev.date;
        }
      }
    }
  }
  for (const m of store.members) {
    if (memberMap[m.id]) {
      m.totalHours = memberMap[m.id].hours;
      m.totalSessions = memberMap[m.id].sessions;
      m.lastOvertimeDate = memberMap[m.id].lastDate;
    }
  }
}

// Add an overtime event
export async function recordOvertimeEvent(params: {
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  time?: string;
  taskCategory?: 'Tugas Pokok' | 'Tugas Support';
  taskType?: string;
  room?: string;
  agenda?: string;
  country?: string;
  flightNumber?: string;
  returneesCount?: number;
  assignedMemberIds: string[];
  passMemberIds?: string[];
  technicianRoles?: TechnicianRoles;
  status?: EventStatus;
  notes?: string;
  pdfFileName?: string;
  pdfFileKey?: string;
  pdfFileSize?: number;
  pdfUploadedAt?: string;
}): Promise<OvertimeEvent> {
  await ensureSchemaInitialized();
  const store = await getOvertimeStore();

  const title = validateTitle(params.title);

  if (!isValidDateString(params.date)) {
    throw new Error('Format tanggal kegiatan tidak valid. Gunakan format YYYY-MM-DD (contoh: 2026-11-10).');
  }

  const isOvertime = isOvertimeEvent({ ...params, taskType: params.taskType, title });
  const assignedMemberIds = validateAssignedMembers(params.assignedMemberIds, store.members, isOvertime);

  let durationHours = 4;
  if (params.startTime || params.endTime) {
    durationHours = calculateAndValidateDuration(params.startTime, params.endTime, 4);
  }

  const assignedNames: string[] = [];
  store.members.forEach((member) => {
    if (assignedMemberIds.includes(member.id)) {
      assignedNames.push(member.name);
    }
  });

  const formattedTime =
    params.time ||
    (params.startTime && params.endTime
      ? `${params.startTime} - ${params.endTime}`
      : params.startTime || '17:00 - 21:00');

  const taskCategory = validateTaskCategory(params.taskCategory);
  const status = validateEventStatus(params.status);
  const { pdfFileKey, pdfFileSize } = validatePdfMetadata(params.pdfFileKey, params.pdfFileSize);

  const newEvent: OvertimeEvent = {
    id: `EVT-${Date.now()}`,
    title,
    date: params.date,
    startTime: params.startTime,
    endTime: params.endTime,
    time: formattedTime,
    taskCategory,
    taskType: params.taskType ? String(params.taskType).slice(0, 100) : undefined,
    room: params.room ? String(params.room).slice(0, 100) : undefined,
    agenda: params.agenda || params.notes || '',
    country: params.country || 'Gandul Central / Studio Multimedia',
    flightNumber: params.flightNumber || 'EVT-01',
    returneesCount: params.returneesCount ?? assignedMemberIds.length,
    durationHours,
    assignedMemberIds,
    assignedMemberNames: assignedNames,
    passMemberIds: params.passMemberIds || [],
    technicianRoles: params.technicianRoles,
    status,
    notes: params.notes || params.agenda || '',
    pdfFileName: params.pdfFileName ? String(params.pdfFileName).slice(0, 200) : undefined,
    pdfFileKey,
    pdfFileSize,
    pdfUploadedAt: params.pdfUploadedAt,
    createdAt: new Date().toISOString(),
  };

  store.events.push(newEvent);
  recalculateMemberTotals(store);

  // Jika Neon Postgres aktif, insert ke database
  if (sql) {
    try {
      await sql`
        INSERT INTO events (
          id, title, date, start_time, end_time, time, task_category, task_type, room, agenda,
          duration_hours, assigned_member_ids, assigned_member_names, technician_roles, status, notes,
          pdf_file_name, pdf_file_key, pdf_file_size, pdf_uploaded_at, created_at
        ) VALUES (
          ${newEvent.id}, ${newEvent.title}, ${newEvent.date}, ${newEvent.startTime || null},
          ${newEvent.endTime || null}, ${newEvent.time || null}, ${newEvent.taskCategory || 'Tugas Pokok'},
          ${newEvent.taskType || null}, ${newEvent.room || null}, ${newEvent.agenda || null},
          ${newEvent.durationHours}, ${JSON.stringify(newEvent.assignedMemberIds)}::jsonb,
          ${JSON.stringify(newEvent.assignedMemberNames)}::jsonb,
          ${JSON.stringify(newEvent.technicianRoles || {})}::jsonb,
          ${newEvent.status || 'Upcoming Session'},
          ${newEvent.notes || null}, ${newEvent.pdfFileName || null}, ${newEvent.pdfFileKey || null},
          ${newEvent.pdfFileSize || null}, ${newEvent.pdfUploadedAt || null}, ${newEvent.createdAt}
        )
      `;

      // Update akumulasi jam teknisi di Neon Postgres
      for (const m of store.members) {
        await sql`
          UPDATE members 
          SET total_hours = ${m.totalHours}, total_sessions = ${m.totalSessions}, last_overtime_date = ${m.lastOvertimeDate}
          WHERE id = ${m.id}
        `;
      }
    } catch (dbErr) {
      console.warn('Gagal sync ke Neon Postgres:', dbErr);
    }
  }

  await saveOvertimeStore(store);
  return newEvent;
}

// Update an existing overtime event
export async function updateOvertimeEvent(params: {
  id: string;
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  time?: string;
  taskCategory?: TaskCategory;
  taskType?: string;
  room?: string;
  agenda?: string;
  assignedMemberIds?: string[];
  technicianRoles?: TechnicianRoles;
  status?: EventStatus;
  notes?: string;
  pdfFileName?: string;
  pdfFileKey?: string;
  pdfFileSize?: number;
  pdfUploadedAt?: string;
}): Promise<OvertimeEvent> {
  if (!params.id || typeof params.id !== 'string') {
    throw new Error('ID jadwal kegiatan wajib disertakan.');
  }

  await ensureSchemaInitialized();
  const store = await getOvertimeStore();
  const index = store.events.findIndex((e) => e.id === params.id);
  if (index === -1) {
    throw new Error('Jadwal kegiatan tidak ditemukan.');
  }

  const existing = store.events[index];

  const title = params.title !== undefined ? validateTitle(params.title) : existing.title;

  let date = existing.date;
  if (params.date !== undefined) {
    if (!isValidDateString(params.date)) {
      throw new Error('Format tanggal kegiatan tidak valid. Gunakan format YYYY-MM-DD.');
    }
    date = params.date;
  }

  const start = params.startTime !== undefined ? params.startTime : existing.startTime;
  const end = params.endTime !== undefined ? params.endTime : existing.endTime;
  let durationHours = existing.durationHours || 4;
  if (start || end) {
    durationHours = calculateAndValidateDuration(start, end, durationHours);
  }

  const taskType = params.taskType !== undefined ? params.taskType : existing.taskType;
  const isOvertime = isOvertimeEvent({ taskType, title });

  let assignedMemberIds = existing.assignedMemberIds;
  if (params.assignedMemberIds !== undefined) {
    assignedMemberIds = validateAssignedMembers(params.assignedMemberIds, store.members, isOvertime);
  }

  const assignedMemberNames = store.members
    .filter((m) => assignedMemberIds.includes(m.id))
    .map((m) => m.name);

  const formattedTime =
    params.time || (start && end ? `${start} - ${end}` : existing.time || '17:00 - 21:00');

  const taskCategory =
    params.taskCategory !== undefined
      ? validateTaskCategory(params.taskCategory)
      : existing.taskCategory;

  const status =
    params.status !== undefined
      ? validateEventStatus(params.status)
      : existing.status;

  const { pdfFileKey, pdfFileSize } = validatePdfMetadata(
    params.pdfFileKey !== undefined ? params.pdfFileKey : existing.pdfFileKey,
    params.pdfFileSize !== undefined ? params.pdfFileSize : existing.pdfFileSize
  );

  const updated: OvertimeEvent = {
    ...existing,
    title: params.title !== undefined ? params.title : existing.title,
    date: params.date !== undefined ? params.date : existing.date,
    startTime: start,
    endTime: end,
    time: formattedTime,
    taskCategory: params.taskCategory !== undefined ? params.taskCategory : existing.taskCategory,
    taskType: params.taskType !== undefined ? params.taskType : existing.taskType,
    room: params.room !== undefined ? params.room : existing.room,
    agenda: params.agenda !== undefined ? params.agenda : existing.agenda,
    notes:
      params.notes !== undefined
        ? params.notes
        : params.agenda !== undefined
        ? params.agenda
        : existing.notes,
    durationHours,
    assignedMemberIds,
    assignedMemberNames,
    technicianRoles:
      params.technicianRoles !== undefined
        ? params.technicianRoles
        : existing.technicianRoles,
    status: params.status !== undefined ? params.status : existing.status,
    pdfFileName: params.pdfFileName !== undefined ? params.pdfFileName : existing.pdfFileName,
    pdfFileKey: params.pdfFileKey !== undefined ? params.pdfFileKey : existing.pdfFileKey,
    pdfFileSize: params.pdfFileSize !== undefined ? params.pdfFileSize : existing.pdfFileSize,
    pdfUploadedAt:
      params.pdfUploadedAt !== undefined ? params.pdfUploadedAt : existing.pdfUploadedAt,
  };

  store.events[index] = updated;
  recalculateMemberTotals(store);

  if (sql) {
    try {
      await sql`
        UPDATE events SET
          title = ${updated.title},
          date = ${updated.date},
          start_time = ${updated.startTime || null},
          end_time = ${updated.endTime || null},
          time = ${updated.time || null},
          task_category = ${updated.taskCategory || 'Tugas Pokok'},
          task_type = ${updated.taskType || null},
          room = ${updated.room || null},
          agenda = ${updated.agenda || null},
          duration_hours = ${updated.durationHours},
          assigned_member_ids = ${JSON.stringify(updated.assignedMemberIds)}::jsonb,
          assigned_member_names = ${JSON.stringify(updated.assignedMemberNames)}::jsonb,
          technician_roles = ${JSON.stringify(updated.technicianRoles || {})}::jsonb,
          status = ${updated.status || 'Upcoming Session'},
          notes = ${updated.notes || null},
          pdf_file_name = ${updated.pdfFileName || null},
          pdf_file_key = ${updated.pdfFileKey || null},
          pdf_file_size = ${updated.pdfFileSize || null},
          pdf_uploaded_at = ${updated.pdfUploadedAt || null}
        WHERE id = ${updated.id}
      `;

      for (const m of store.members) {
        await sql`
          UPDATE members 
          SET total_hours = ${m.totalHours}, total_sessions = ${m.totalSessions}, last_overtime_date = ${m.lastOvertimeDate}
          WHERE id = ${m.id}
        `;
      }
    } catch (dbErr) {
      console.warn('Gagal update ke Neon Postgres:', dbErr);
    }
  }

  await saveOvertimeStore(store);
  return updated;
}

// Delete an existing overtime event
export async function deleteOvertimeEvent(id: string): Promise<void> {
  const store = await getOvertimeStore();
  const exists = store.events.some((e) => e.id === id);
  if (!exists) {
    throw new Error('Jadwal kegiatan tidak ditemukan.');
  }

  store.events = store.events.filter((e) => e.id !== id);
  recalculateMemberTotals(store);

  if (sql) {
    try {
      await sql`DELETE FROM events WHERE id = ${id}`;
      for (const m of store.members) {
        await sql`
          UPDATE members 
          SET total_hours = ${m.totalHours}, total_sessions = ${m.totalSessions}, last_overtime_date = ${m.lastOvertimeDate}
          WHERE id = ${m.id}
        `;
      }
    } catch (dbErr) {
      console.warn('Gagal delete di Neon Postgres:', dbErr);
    }
  }

  await saveOvertimeStore(store);
}

// Dynamic Team Management: Add member
export async function addTeamMember(name: string, role?: string): Promise<Member> {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Nama personil tidak boleh kosong.');
  }
  const cleanName = name.trim();
  if (cleanName.length < 2 || cleanName.length > 100) {
    throw new Error('Nama personil harus antara 2 hingga 100 karakter.');
  }
  const cleanRole =
    typeof role === 'string' && role.trim() ? role.trim().slice(0, 100) : 'Engineer Multimedia';

  await ensureSchemaInitialized();
  const store = await getOvertimeStore();
  const newMember: Member = {
    id: `m_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: cleanName,
    role: cleanRole,
    totalHours: 0,
    totalSessions: 0,
    lastOvertimeDate: null,
    createdAt: new Date().toISOString(),
  };

  store.members.push(newMember);

  if (sql) {
    try {
      await sql`
        INSERT INTO members (id, name, role, total_hours, total_sessions, last_overtime_date, created_at)
        VALUES (${newMember.id}, ${newMember.name}, ${newMember.role}, 0, 0, NULL, ${newMember.createdAt})
      `;
    } catch (dbErr) {
      console.warn('Gagal insert member ke Neon Postgres:', dbErr);
    }
  }

  await saveOvertimeStore(store);
  return newMember;
}

// Dynamic Team Management: Update member
export async function updateTeamMember(id: string, name: string, role?: string): Promise<Member> {
  if (!id || typeof id !== 'string') {
    throw new Error('ID personil wajib disertakan.');
  }
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Nama personil tidak boleh kosong.');
  }
  const cleanName = name.trim();
  if (cleanName.length < 2 || cleanName.length > 100) {
    throw new Error('Nama personil harus antara 2 hingga 100 karakter.');
  }
  const cleanRole = typeof role === 'string' && role.trim() ? role.trim().slice(0, 100) : undefined;

  await ensureSchemaInitialized();
  const store = await getOvertimeStore();
  const index = store.members.findIndex((m) => m.id === id);
  if (index === -1) {
    throw new Error('Personil tidak ditemukan.');
  }

  store.members[index].name = cleanName;
  if (cleanRole) {
    store.members[index].role = cleanRole;
  }

  if (sql) {
    try {
      await sql`
        UPDATE members SET name = ${store.members[index].name}, role = ${store.members[index].role}
        WHERE id = ${id}
      `;
    } catch (dbErr) {
      console.warn('Gagal update member di Neon Postgres:', dbErr);
    }
  }

  await saveOvertimeStore(store);
  return store.members[index];
}

// Dynamic Team Management: Delete member
export async function deleteTeamMember(id: string): Promise<void> {
  if (!id || typeof id !== 'string') {
    throw new Error('ID personil wajib disertakan.');
  }

  await ensureSchemaInitialized();
  const store = await getOvertimeStore();
  store.members = store.members.filter((m) => m.id !== id);

  if (sql) {
    try {
      await sql`DELETE FROM members WHERE id = ${id}`;
    } catch (dbErr) {
      console.warn('Gagal delete member di Neon Postgres:', dbErr);
    }
  }

  await saveOvertimeStore(store);
}

// ==========================================
// Task Types (Jenis Tugas) Table Management
// ==========================================

export async function getTaskTypes(): Promise<TaskType[]> {
  const store = await getOvertimeStore();
  return Array.isArray(store.taskTypes) ? store.taskTypes : [...DEFAULT_TASK_TYPES];
}

export async function addTaskType(name: string, category: TaskCategory): Promise<TaskType> {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Nama jenis tugas tidak boleh kosong.');
  }
  const cleanName = name.trim();
  if (cleanName.length < 2 || cleanName.length > 100) {
    throw new Error('Nama jenis tugas harus antara 2 hingga 100 karakter.');
  }
  const validCategory = validateTaskCategory(category);

  await ensureSchemaInitialized();
  const store = await getOvertimeStore();
  if (!Array.isArray(store.taskTypes)) {
    store.taskTypes = [];
  }

  const newType: TaskType = {
    id: `tt-${Date.now()}`,
    name: cleanName,
    category: validCategory,
    createdAt: new Date().toISOString(),
  };

  store.taskTypes.push(newType);

  if (sql) {
    try {
      await sql`
        INSERT INTO task_types (id, name, category, created_at, updated_at)
        VALUES (${newType.id}, ${newType.name}, ${newType.category}, ${newType.createdAt}, ${newType.createdAt})
      `;
    } catch (dbErr) {
      console.warn('Gagal insert task_type di Neon Postgres:', dbErr);
    }
  }

  await saveOvertimeStore(store);
  return newType;
}

export async function updateTaskType(
  id: string,
  name: string,
  category?: TaskCategory
): Promise<TaskType> {
  if (!id || typeof id !== 'string') {
    throw new Error('ID jenis tugas wajib disertakan.');
  }
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Nama jenis tugas tidak boleh kosong.');
  }
  const cleanName = name.trim();
  if (cleanName.length < 2 || cleanName.length > 100) {
    throw new Error('Nama jenis tugas harus antara 2 hingga 100 karakter.');
  }

  await ensureSchemaInitialized();
  const store = await getOvertimeStore();
  if (!Array.isArray(store.taskTypes)) {
    store.taskTypes = [];
  }

  const index = store.taskTypes.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error('Jenis tugas tidak ditemukan.');
  }

  store.taskTypes[index].name = cleanName;
  if (category) {
    store.taskTypes[index].category = validateTaskCategory(category);
  }
  store.taskTypes[index].updatedAt = new Date().toISOString();

  if (sql) {
    try {
      await sql`
        UPDATE task_types 
        SET name = ${store.taskTypes[index].name}, category = ${store.taskTypes[index].category}, updated_at = ${store.taskTypes[index].updatedAt}
        WHERE id = ${id}
      `;
    } catch (dbErr) {
      console.warn('Gagal update task_type di Neon Postgres:', dbErr);
    }
  }

  await saveOvertimeStore(store);
  return store.taskTypes[index];
}

export async function deleteTaskType(id: string): Promise<void> {
  if (!id || typeof id !== 'string') {
    throw new Error('ID jenis tugas wajib disertakan.');
  }

  await ensureSchemaInitialized();
  const store = await getOvertimeStore();
  if (!Array.isArray(store.taskTypes)) {
    store.taskTypes = [];
  }

  store.taskTypes = store.taskTypes.filter((t) => t.id !== id);

  if (sql) {
    try {
      await sql`DELETE FROM task_types WHERE id = ${id}`;
    } catch (dbErr) {
      console.warn('Gagal delete task_type di Neon Postgres:', dbErr);
    }
  }

  await saveOvertimeStore(store);
}

// ==========================================
// Rooms (Daftar Ruangan) Table Management
// ==========================================

export async function getRooms(): Promise<Room[]> {
  const store = await getOvertimeStore();
  return Array.isArray(store.rooms) ? store.rooms : [...DEFAULT_ROOMS];
}

export async function addRoom(name: string): Promise<Room> {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Nama ruangan tidak boleh kosong.');
  }
  const cleanName = name.trim();
  if (cleanName.length < 2 || cleanName.length > 100) {
    throw new Error('Nama ruangan harus antara 2 hingga 100 karakter.');
  }

  await ensureSchemaInitialized();
  const store = await getOvertimeStore();
  if (!Array.isArray(store.rooms)) {
    store.rooms = [...DEFAULT_ROOMS];
  }

  const newRoom: Room = {
    id: `rm-${Date.now()}`,
    name: cleanName,
    createdAt: new Date().toISOString(),
  };

  store.rooms.push(newRoom);

  if (sql) {
    try {
      await sql`
        INSERT INTO rooms (id, name, created_at, updated_at)
        VALUES (${newRoom.id}, ${newRoom.name}, ${newRoom.createdAt}, ${newRoom.createdAt})
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
      `;
    } catch (dbErr) {
      console.warn('Gagal insert room di Neon Postgres:', dbErr);
    }
  }

  await saveOvertimeStore(store);
  return newRoom;
}

export async function updateRoom(id: string, name: string): Promise<Room> {
  if (!id || typeof id !== 'string') {
    throw new Error('ID ruangan wajib disertakan.');
  }
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Nama ruangan tidak boleh kosong.');
  }
  const cleanName = name.trim();
  if (cleanName.length < 2 || cleanName.length > 100) {
    throw new Error('Nama ruangan harus antara 2 hingga 100 karakter.');
  }

  await ensureSchemaInitialized();
  const store = await getOvertimeStore();
  if (!Array.isArray(store.rooms)) {
    store.rooms = [...DEFAULT_ROOMS];
  }

  const index = store.rooms.findIndex((r) => r.id === id);
  if (index === -1) {
    throw new Error('Ruangan tidak ditemukan.');
  }

  store.rooms[index].name = cleanName;
  store.rooms[index].updatedAt = new Date().toISOString();

  if (sql) {
    try {
      await sql`
        UPDATE rooms SET name = ${store.rooms[index].name}, updated_at = ${store.rooms[index].updatedAt}
        WHERE id = ${id}
      `;
    } catch (dbErr) {
      console.warn('Gagal update room di Neon Postgres:', dbErr);
    }
  }

  await saveOvertimeStore(store);
  return store.rooms[index];
}

export async function deleteRoom(id: string): Promise<void> {
  if (!id || typeof id !== 'string') {
    throw new Error('ID ruangan wajib disertakan.');
  }

  await ensureSchemaInitialized();
  const store = await getOvertimeStore();
  if (!Array.isArray(store.rooms)) {
    store.rooms = [...DEFAULT_ROOMS];
  }

  store.rooms = store.rooms.filter((r) => r.id !== id);

  if (sql) {
    try {
      await sql`DELETE FROM rooms WHERE id = ${id}`;
    } catch (dbErr) {
      console.warn('Gagal delete room di Neon Postgres:', dbErr);
    }
  }

  await saveOvertimeStore(store);
}
