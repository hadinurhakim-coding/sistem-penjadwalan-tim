import fs from 'fs/promises';
import path from 'path';
import { sql } from './db';
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
    status: row.status || 'Upcoming Session',
    notes: row.notes || undefined,
    pdfFileName: row.pdf_file_name || undefined,
    pdfFileKey: row.pdf_file_key || undefined,
    pdfFileSize: row.pdf_file_size ? Number(row.pdf_file_size) : undefined,
    pdfUploadedAt: row.pdf_uploaded_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// Helper: Ensure storage exists and read data (Neon Postgres atau Fallback Lokal)
export async function getOvertimeStore(): Promise<OvertimeStore> {
  if (sql) {
    try {
      // Pastikan tabel rooms dan kolom room & task_type tersedia di Neon Postgres
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
      } catch {}

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

      const rooms: Room[] = Array.isArray(roomsRows) && roomsRows.length > 0
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
    return {
      members: parsed.members || DEFAULT_MEMBERS,
      events: parsed.events || [],
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
    events: store.events,
    metrics,
    taskTypes: store.taskTypes || DEFAULT_TASK_TYPES,
    rooms: store.rooms || DEFAULT_ROOMS,
  };
}

// Recalculate member total hours, sessions, and last overtime date
// NOTE: Per requirement, any task containing "Lembur" or "GR (Gladi Resik)" counts towards overtime balance & fair queue!
export function recalculateMemberTotals(store: OvertimeStore) {
  const memberMap: Record<string, { hours: number; sessions: number; lastDate: string | null }> = {};
  for (const m of store.members) {
    memberMap[m.id] = { hours: 0, sessions: 0, lastDate: null };
  }
  for (const ev of store.events) {
    // Setiap kegiatan dengan kata "Lembur" atau "GR (Gladi Resik)" dihitung ke akumulasi jam lembur
    if (!isOvertimeEvent(ev)) {
      continue;
    }

    const dur = ev.durationHours || 4;
    for (const memId of ev.assignedMemberIds || []) {
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
  status?: 'Upcoming Session' | 'In Progress' | 'Completed';
  notes?: string;
  pdfFileName?: string;
  pdfFileKey?: string;
  pdfFileSize?: number;
  pdfUploadedAt?: string;
}): Promise<OvertimeEvent> {
  const store = await getOvertimeStore();

  if (!params.title || !params.date) {
    throw new Error('Nama kegiatan dan tanggal wajib diisi.');
  }

  const isOvertime = isOvertimeEvent({ ...params, taskType: params.taskType, title: params.title });
  const assignedMemberIds = params.assignedMemberIds || [];
  if (isOvertime && assignedMemberIds.length === 0) {
    throw new Error('Untuk kegiatan lembur, wajib memilih personil teknisi yang bertugas.');
  }

  // Calculate duration from start and end time if possible, otherwise default 4 hours
  let durationHours = 4;
  if (params.startTime && params.endTime) {
    const [startH, startM] = params.startTime.split(':').map(Number);
    const [endH, endM] = params.endTime.split(':').map(Number);
    if (!isNaN(startH) && !isNaN(endH)) {
      const diff = endH * 60 + (endM || 0) - (startH * 60 + (startM || 0));
      if (diff > 0) {
        durationHours = Math.round((diff / 60) * 10) / 10;
      }
    }
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

  const newEvent: OvertimeEvent = {
    id: `EVT-${Date.now()}`,
    title: params.title,
    date: params.date,
    startTime: params.startTime,
    endTime: params.endTime,
    time: formattedTime,
    taskCategory: params.taskCategory || 'Tugas Pokok',
    taskType: params.taskType,
    room: params.room,
    agenda: params.agenda || params.notes || '',
    country: params.country || 'Gandul Central / Studio Multimedia',
    flightNumber: params.flightNumber || 'EVT-01',
    returneesCount: params.returneesCount ?? assignedMemberIds.length,
    durationHours,
    assignedMemberIds,
    assignedMemberNames: assignedNames,
    passMemberIds: params.passMemberIds || [],
    status: params.status || 'Upcoming Session',
    notes: params.notes || params.agenda || '',
    pdfFileName: params.pdfFileName,
    pdfFileKey: params.pdfFileKey,
    pdfFileSize: params.pdfFileSize,
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
          duration_hours, assigned_member_ids, assigned_member_names, status, notes,
          pdf_file_name, pdf_file_key, pdf_file_size, pdf_uploaded_at, created_at
        ) VALUES (
          ${newEvent.id}, ${newEvent.title}, ${newEvent.date}, ${newEvent.startTime || null},
          ${newEvent.endTime || null}, ${newEvent.time || null}, ${newEvent.taskCategory || 'Tugas Pokok'},
          ${newEvent.taskType || null}, ${newEvent.room || null}, ${newEvent.agenda || null},
          ${newEvent.durationHours}, ${JSON.stringify(newEvent.assignedMemberIds)}::jsonb,
          ${JSON.stringify(newEvent.assignedMemberNames)}::jsonb, ${newEvent.status || 'Upcoming Session'},
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
  status?: 'Upcoming Session' | 'In Progress' | 'Completed';
  notes?: string;
  pdfFileName?: string;
  pdfFileKey?: string;
  pdfFileSize?: number;
  pdfUploadedAt?: string;
}): Promise<OvertimeEvent> {
  const store = await getOvertimeStore();
  const index = store.events.findIndex((e) => e.id === params.id);
  if (index === -1) {
    throw new Error('Jadwal kegiatan tidak ditemukan.');
  }

  const existing = store.events[index];

  // Calculate duration if start and end time provided
  let durationHours = existing.durationHours || 4;
  const start = params.startTime || existing.startTime;
  const end = params.endTime || existing.endTime;
  if (start && end) {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    if (!isNaN(startH) && !isNaN(endH)) {
      const diff = endH * 60 + (endM || 0) - (startH * 60 + (startM || 0));
      if (diff > 0) {
        durationHours = Math.round((diff / 60) * 10) / 10;
      }
    }
  }

  const assignedMemberIds = params.assignedMemberIds || existing.assignedMemberIds;
  const assignedMemberNames = store.members
    .filter((m) => assignedMemberIds.includes(m.id))
    .map((m) => m.name);

  const formattedTime =
    params.time || (start && end ? `${start} - ${end}` : existing.time || '17:00 - 21:00');

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
  if (!name.trim()) {
    throw new Error('Nama personil tidak boleh kosong.');
  }

  const store = await getOvertimeStore();
  const newMember: Member = {
    id: `m_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    role: (role && role.trim()) || 'Engineer Multimedia',
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
  const store = await getOvertimeStore();
  const index = store.members.findIndex((m) => m.id === id);
  if (index === -1) {
    throw new Error('Personil tidak ditemukan.');
  }

  store.members[index].name = name.trim();
  if (role) {
    store.members[index].role = role.trim();
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
  if (!name.trim()) {
    throw new Error('Nama jenis tugas tidak boleh kosong.');
  }
  const store = await getOvertimeStore();
  if (!Array.isArray(store.taskTypes)) {
    store.taskTypes = [];
  }

  const newType: TaskType = {
    id: `tt-${Date.now()}`,
    name: name.trim(),
    category,
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
  if (!name.trim()) {
    throw new Error('Nama jenis tugas tidak boleh kosong.');
  }
  const store = await getOvertimeStore();
  if (!Array.isArray(store.taskTypes)) {
    store.taskTypes = [];
  }

  const index = store.taskTypes.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error('Jenis tugas tidak ditemukan.');
  }

  store.taskTypes[index].name = name.trim();
  if (category) {
    store.taskTypes[index].category = category;
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
  return Array.isArray(store.rooms) && store.rooms.length > 0 ? store.rooms : [...DEFAULT_ROOMS];
}

export async function addRoom(name: string): Promise<Room> {
  if (!name.trim()) {
    throw new Error('Nama ruangan tidak boleh kosong.');
  }
  const store = await getOvertimeStore();
  if (!Array.isArray(store.rooms)) {
    store.rooms = [...DEFAULT_ROOMS];
  }

  const newRoom: Room = {
    id: `rm-${Date.now()}`,
    name: name.trim(),
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
  if (!name.trim()) {
    throw new Error('Nama ruangan tidak boleh kosong.');
  }
  const store = await getOvertimeStore();
  if (!Array.isArray(store.rooms)) {
    store.rooms = [...DEFAULT_ROOMS];
  }

  const index = store.rooms.findIndex((r) => r.id === id);
  if (index === -1) {
    throw new Error('Ruangan tidak ditemukan.');
  }

  store.rooms[index].name = name.trim();
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
