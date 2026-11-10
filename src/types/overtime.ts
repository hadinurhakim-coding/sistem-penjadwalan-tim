export interface Member {
  id: string;
  name: string;
  email?: string;
  role: string;
  totalHours: number;
  totalSessions: number;
  lastOvertimeDate: string | null; // ISO or YYYY-MM-DD
  createdAt: string;
}

export type PriorityStatus = 'Kandidat Utama' | 'Cadangan 1' | 'Cadangan 2' | 'Antrean';

export interface RankedMember extends Member {
  rank: number;
  statusLabel: PriorityStatus;
  reasoning: string;
}

export type TaskCategory = 'Tugas Pokok' | 'Tugas Support';

export interface OvertimeEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // e.g. "17:00"
  endTime?: string; // e.g. "21:00"
  time?: string; // e.g. "17:00 - 21:00"
  taskCategory?: TaskCategory; // 'Tugas Pokok' (Tupoksi) vs 'Tugas Support' (Perbantuan)
  agenda?: string; // Agenda / Kegiatan detail
  country?: string; // optional legacy
  flightNumber?: string; // optional legacy
  returneesCount?: number; // optional legacy
  durationHours: number; // default 4 for weekday incidental
  assignedMemberIds: string[];
  assignedMemberNames: string[];
  passMemberIds?: string[]; // members who passed/berhalangan
  status?: 'Upcoming Session' | 'In Progress' | 'Completed';
  notes?: string;
  pdfFileName?: string;
  pdfFileKey?: string;
  pdfFileSize?: number;
  pdfUploadedAt?: string;
  createdAt: string;
}

export interface TaskType {
  id: string;
  name: string;
  category: TaskCategory;
  createdAt?: string;
  updatedAt?: string;
}

export interface OvertimeStore {
  members: Member[];
  events: OvertimeEvent[];
  taskTypes?: TaskType[];
}

export interface FairnessMetrics {
  totalMembers: number;
  totalDistributedHours: number;
  totalEvents: number;
  maxDiffHours: number;
  fairnessRating: 'Keadilan Sempurna' | 'Sangat Seimbang' | 'Wajar' | 'Perlu Penyeimbangan';
  fairnessColor: string;
}

export interface OvertimeApiResponse {
  members: Member[];
  rankedMembers: RankedMember[];
  topCandidates: RankedMember[];
  backupCandidates: RankedMember[];
  events: OvertimeEvent[];
  metrics: FairnessMetrics;
  taskTypes?: TaskType[];
}
