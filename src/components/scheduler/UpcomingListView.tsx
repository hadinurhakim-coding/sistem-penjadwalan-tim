'use client';

import * as React from 'react';
import { OvertimeEvent, EventStatus } from '@/types/overtime';
import { ScheduleDetailModal } from '@/components/scheduler/ScheduleDetailModal';
import {
  Search,
  FileText,
  ChevronDown,
  SlidersHorizontal,
  Download,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpDown,
  CheckCircle2,
  Eye,
  Clock4,
  Ban,
} from 'lucide-react';

interface UpcomingListViewProps {
  events: OvertimeEvent[];
  onOpenAddSchedule: () => void;
  onEditSchedule?: (event: OvertimeEvent) => void;
  onDataRefreshed?: (refreshedData: any) => void;
  onExportCSV: () => void;
}

export function UpcomingListView({
  events,
  onOpenAddSchedule,
  onEditSchedule,
  onDataRefreshed,
  onExportCSV,
}: UpcomingListViewProps) {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState<
    'ALL' | 'Terjadwal' | 'Selesai' | 'Batal' | 'Berubah' | 'Tugas Pokok' | 'Tugas Support'
  >('ALL');
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  const [isCompact, setIsCompact] = React.useState(false);

  // Pagination States
  const [rowsPerPage, setRowsPerPage] = React.useState<number>(5);
  const [currentPage, setCurrentPage] = React.useState<number>(1);

  // Detail Modal State
  const [selectedDetailEvent, setSelectedDetailEvent] = React.useState<OvertimeEvent | null>(null);

  // Row Action Dropdown & Delete State
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = React.useState<OvertimeEvent | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState('');

  // Close menus when clicking outside
  const filterRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (activeMenuId && !(event.target as HTMLElement).closest('.row-action-menu')) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  // Handle Event Deletion
  const handleDelete = async (eventId: string) => {
    setIsDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/overtime?id=${encodeURIComponent(eventId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghapus jadwal kegiatan.');
      }

      setConfirmDeleteEvent(null);
      setActiveMenuId(null);
      if (onDataRefreshed) {
        onDataRefreshed(json.data);
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Terjadi kesalahan sistem saat menghapus.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Status Update
  const handleQuickUpdateStatus = async (eventId: string, newStatus: EventStatus) => {
    try {
      const res = await fetch('/api/overtime', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: eventId,
          status: newStatus,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memperbarui status agenda.');
      }

      setActiveMenuId(null);
      if (onDataRefreshed) {
        onDataRefreshed(json.data);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status');
    }
  };

  // Helper status badge renderer
  const renderStatusBadge = (status?: string) => {
    if (status === 'Batal') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
          <span className="size-1.5 rounded-full bg-rose-500" />
          <span>Batal</span>
        </span>
      );
    }
    if (status === 'Berubah') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
          <span className="size-1.5 rounded-full bg-amber-500" />
          <span>Berubah</span>
        </span>
      );
    }
    if (status === 'Completed' || status === 'Selesai') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
          <span className="size-1.5 rounded-full bg-blue-500" />
          <span>Selesai</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        <span>Active</span>
      </span>
    );
  };

  // Filtered and Sorted Events
  const filteredEvents = React.useMemo(() => {
    return events
      .filter((evt) => {
        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = evt.title?.toLowerCase().includes(q);
          const matchAgenda = evt.agenda?.toLowerCase().includes(q);
          const matchMember = evt.assignedMemberNames?.some((n) => n.toLowerCase().includes(q));
          const matchCategory = evt.taskCategory?.toLowerCase().includes(q);
          const matchTaskType = evt.taskType?.toLowerCase().includes(q);
          const matchRoom = evt.room?.toLowerCase().includes(q);
          const matchStatus = evt.status?.toLowerCase().includes(q);
          const matchId = evt.id?.toLowerCase().includes(q);
          if (!matchTitle && !matchAgenda && !matchMember && !matchCategory && !matchTaskType && !matchRoom && !matchStatus && !matchId) {
            return false;
          }
        }

        // Category / Status Filter
        if (filterCategory === 'Terjadwal') {
          return !evt.status || evt.status === 'Terjadwal' || evt.status === 'Upcoming Session' || evt.status === 'In Progress';
        }
        if (filterCategory === 'Selesai') {
          return evt.status === 'Completed' || evt.status === 'Selesai';
        }
        if (filterCategory === 'Batal') {
          return evt.status === 'Batal';
        }
        if (filterCategory === 'Berubah') {
          return evt.status === 'Berubah';
        }
        if (filterCategory === 'Tugas Pokok') {
          return !evt.taskCategory || evt.taskCategory === 'Tugas Pokok';
        }
        if (filterCategory === 'Tugas Support') {
          return evt.taskCategory === 'Tugas Support';
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
  }, [events, searchQuery, filterCategory, sortOrder]);

  // Reset pagination when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, rowsPerPage]);

  // Pagination Slicing
  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  // Helper to generate a clean short display code like APP15, BULKBUY in Gambar 1
  const getEventCode = (evt: OvertimeEvent, index: number) => {
    const rawNumber = evt.id.replace(/\D/g, '').slice(-3) || (index + 1).toString().padStart(2, '0');
    return `SCH-${rawNumber}`;
  };

  // Helper to format date cleanly
  const formatEventDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Check if date is in the past
  const isPastDate = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr);
    return d < today;
  };

  return (
    <div className="rounded-2xl border border-gray-200/80 dark:border-[#1F1F1F] bg-white dark:bg-[#0A0A0A] p-5 sm:p-6 shadow-xs transition-colors">
      {/* Top Header & Toolbar matching Gambar 1 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-5">
        {/* Left: Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari jadwal kegiatan, agenda, atau teknisi..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black text-xs text-[#1E293B] dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#00A2E9] focus:ring-1 focus:ring-[#00A2E9] transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-400 cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Right Controls: Filter dropdown, View toggle, Ekspor CSV, + Tambah Jadwal */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Dropdown matching 'All status ˅' */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black text-xs font-semibold text-[#1E293B] dark:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors shadow-2xs cursor-pointer"
            >
              <span>
                {filterCategory === 'ALL' && 'Semua Status'}
                {filterCategory === 'Terjadwal' && 'Terjadwal (Active)'}
                {filterCategory === 'Selesai' && 'Selesai'}
                {filterCategory === 'Batal' && 'Batal'}
                {filterCategory === 'Berubah' && 'Berubah'}
                {filterCategory === 'Tugas Pokok' && 'Tugas Pokok'}
                {filterCategory === 'Tugas Support' && 'Tugas Support'}
              </span>
              <ChevronDown className={`size-3.5 text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-40 w-52 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-zinc-800 shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setFilterCategory('ALL');
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 font-medium hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer flex items-center justify-between ${
                    filterCategory === 'ALL' ? 'text-[#00A2E9] dark:text-[#38BDF8] font-bold bg-[#E0F2FE]/40 dark:bg-zinc-800' : 'text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <span>Semua Status (Semua Agenda)</span>
                  {filterCategory === 'ALL' && <CheckCircle2 className="size-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterCategory('Terjadwal');
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 font-medium hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer flex items-center justify-between ${
                    filterCategory === 'Terjadwal' ? 'text-[#00A2E9] dark:text-[#38BDF8] font-bold bg-[#E0F2FE]/40 dark:bg-zinc-800' : 'text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span>Terjadwal (Active)</span>
                  </span>
                  {filterCategory === 'Terjadwal' && <CheckCircle2 className="size-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterCategory('Selesai');
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 font-medium hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer flex items-center justify-between ${
                    filterCategory === 'Selesai' ? 'text-[#00A2E9] dark:text-[#38BDF8] font-bold bg-[#E0F2FE]/40 dark:bg-zinc-800' : 'text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-blue-500" />
                    <span>Selesai</span>
                  </span>
                  {filterCategory === 'Selesai' && <CheckCircle2 className="size-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterCategory('Berubah');
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 font-medium hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer flex items-center justify-between ${
                    filterCategory === 'Berubah' ? 'text-[#00A2E9] dark:text-[#38BDF8] font-bold bg-[#E0F2FE]/40 dark:bg-zinc-800' : 'text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    <span>Berubah</span>
                  </span>
                  {filterCategory === 'Berubah' && <CheckCircle2 className="size-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterCategory('Batal');
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 font-medium hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer flex items-center justify-between ${
                    filterCategory === 'Batal' ? 'text-[#00A2E9] dark:text-[#38BDF8] font-bold bg-[#E0F2FE]/40 dark:bg-zinc-800' : 'text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-rose-500" />
                    <span>Batal</span>
                  </span>
                  {filterCategory === 'Batal' && <CheckCircle2 className="size-3.5" />}
                </button>
                <div className="h-px bg-slate-100 dark:bg-zinc-800 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setFilterCategory('Tugas Pokok');
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 font-medium hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer flex items-center justify-between ${
                    filterCategory === 'Tugas Pokok' ? 'text-[#00A2E9] dark:text-[#38BDF8] font-bold bg-[#E0F2FE]/40 dark:bg-zinc-800' : 'text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <span>Tugas Pokok (Tupoksi)</span>
                  {filterCategory === 'Tugas Pokok' && <CheckCircle2 className="size-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterCategory('Tugas Support');
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 font-medium hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer flex items-center justify-between ${
                    filterCategory === 'Tugas Support' ? 'text-[#00A2E9] dark:text-[#38BDF8] font-bold bg-[#E0F2FE]/40 dark:bg-zinc-800' : 'text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <span>Tugas Support</span>
                  {filterCategory === 'Tugas Support' && <CheckCircle2 className="size-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* View Button matching Gambar 1 */}
          <button
            type="button"
            onClick={() => setIsCompact(!isCompact)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors shadow-2xs cursor-pointer ${
              isCompact
                ? 'bg-[#E0F2FE] border-[#00A2E9] text-[#005596] dark:bg-zinc-800 dark:border-zinc-600 dark:text-white'
                : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-black text-[#1E293B] dark:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
            title="Ubah kerapatan tampilan baris (Compact / Normal)"
          >
            <SlidersHorizontal className="size-3.5" />
            <span>View</span>
          </button>

          {/* Ekspor CSV */}
          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black text-xs font-semibold text-[#005596] dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors shadow-2xs cursor-pointer"
            title="Unduh seluruh jadwal kegiatan dalam format CSV"
          >
            <Download className="size-3.5 text-[#00A2E9] dark:text-[#38BDF8]" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

          {/* Tambah Jadwal */}
          <button
            type="button"
            onClick={onOpenAddSchedule}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFD100] hover:bg-[#FACC15] text-[#0A2540] text-xs font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Tambah Jadwal</span>
          </button>
        </div>
      </div>

      {deleteError && (
        <div className="mb-4 p-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Modern Data Table matching Gambar 1 */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-black text-slate-500 dark:text-zinc-400 font-bold">
              <th
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="py-3 px-4 font-bold cursor-pointer select-none hover:text-[#00A2E9] transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span># Code</span>
                  <ArrowUpDown className="size-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Description</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Type</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <Calendar className="size-3.5 opacity-70" />
                  <span>Tanggal</span>
                </div>
              </th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <Clock className="size-3.5 opacity-70" />
                  <span>Jam & Durasi</span>
                </div>
              </th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Teknisi Ditugaskan</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Status</th>
              <th className="py-3 px-4 font-bold text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 bg-white dark:bg-[#0A0A0A]">
            {currentEvents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center text-slate-400 dark:text-zinc-500">
                  <Calendar className="size-8 mx-auto text-slate-300 dark:text-zinc-600 mb-2" />
                  <p className="font-semibold text-slate-600 dark:text-zinc-300">
                    Tidak ada jadwal yang sesuai kriteria pencarian.
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                    Coba ganti kata kunci pencarian atau reset filter status.
                  </p>
                </td>
              </tr>
            ) : (
              currentEvents.map((evt, idx) => {
                const code = getEventCode(evt, startIndex + idx);
                const past = isPastDate(evt.date);
                const isSupport = evt.taskCategory === 'Tugas Support';

                return (
                  <tr
                    key={evt.id}
                    className={`hover:bg-[#F8FAFC] dark:hover:bg-[#121212] transition-colors group ${
                      isCompact ? 'h-10' : 'h-14'
                    }`}
                  >
                    {/* # Code */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailEvent(evt)}
                        className="font-extrabold text-[#0A2540] dark:text-white hover:text-[#00A2E9] dark:hover:text-[#38BDF8] transition-colors cursor-pointer flex items-center gap-1 group/code"
                        title="Klik untuk melihat detail agenda"
                      >
                        <span>{code}</span>
                        <Eye className="size-3 opacity-0 group-hover/code:opacity-100 text-[#00A2E9] transition-opacity" />
                      </button>
                    </td>

                    {/* Description (Title + Agenda + Room) */}
                    <td className="py-3 px-4 max-w-xs sm:max-w-md">
                      <div className="font-bold text-[#0A2540] dark:text-white leading-snug line-clamp-1 flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailEvent(evt)}
                          className="hover:text-[#00A2E9] dark:hover:text-[#38BDF8] transition-colors cursor-pointer text-left truncate"
                          title="Klik untuk melihat detail agenda"
                        >
                          {evt.title}
                        </button>
                        {evt.room && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#005596] dark:text-[#38BDF8] bg-[#E0F2FE] dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-[#00A2E9]/20">
                            <MapPin className="size-2.5" />
                            <span>{evt.room}</span>
                          </span>
                        )}
                      </div>
                      {evt.agenda && (
                        <div className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] line-clamp-1 mt-0.5">
                          {evt.agenda}
                        </div>
                      )}
                      {evt.pdfFileKey && (
                        <div className="mt-1">
                          <a
                            href={`/api/agenda/pdf?key=${encodeURIComponent(evt.pdfFileKey)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E0F2FE] dark:bg-zinc-900 text-[#005596] dark:text-[#38BDF8] border border-[#00A2E9]/30 text-[10px] font-bold hover:bg-[#005596] hover:text-white transition-colors"
                          >
                            <FileText className="size-3 text-[#00A2E9]" />
                            <span>{evt.pdfFileName || 'Laporan PDF'}</span>
                          </a>
                        </div>
                      )}
                    </td>

                    {/* Type (Tugas Pokok / Tugas Support) styled like Percentage (%) pill in Gambar 1 */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isSupport
                            ? 'bg-[#00A2E9]/10 text-[#00A2E9] dark:text-[#38BDF8] border border-[#00A2E9]/25'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700'
                        }`}
                      >
                        {evt.taskCategory || 'Tugas Pokok'}
                      </span>
                    </td>

                    {/* Tanggal (Past dates shown in red e.g. 15 Jul 2026 in Gambar 1) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          past
                            ? 'text-red-600 dark:text-red-400 font-semibold'
                            : 'text-[#1E293B] dark:text-zinc-200'
                        }`}
                      >
                        {formatEventDate(evt.date)}
                      </span>
                    </td>

                    {/* Jam & Durasi */}
                    <td className="py-3 px-4 whitespace-nowrap text-[#64748B] dark:text-zinc-400 font-medium">
                      <span>{evt.time || '17:00 - 21:00'}</span>
                      <span className="text-[10px] ml-1 opacity-80">({evt.durationHours || 4} Jam)</span>
                    </td>

                    {/* Teknisi Ditugaskan */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                        {evt.assignedMemberNames?.length ? (
                          evt.assignedMemberNames.map((name, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E0F2FE]/70 dark:bg-zinc-800 text-[#005596] dark:text-[#38BDF8] border border-[#00A2E9]/30 dark:border-zinc-700 text-[11px] font-medium whitespace-nowrap"
                            >
                              <UserCheck className="size-3 text-[#00A2E9] dark:text-[#38BDF8]" />
                              <span>{name}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-500 italic text-[11px]">
                            Belum ditentukan
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status badge matching Active, Selesai, Batal, Berubah */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderStatusBadge(evt.status)}
                    </td>

                    {/* Actions matching the 3-dots in Gambar 1 */}
                    <td className="py-3 px-4 text-right whitespace-nowrap relative">
                      <div className="inline-flex items-center gap-1 justify-end row-action-menu">
                        {/* Direct Detail View Action Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedDetailEvent(evt)}
                          className="p-1 rounded-md text-slate-400 hover:text-[#00A2E9] dark:hover:text-[#38BDF8] hover:bg-[#E0F2FE]/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Lihat Detail Agenda"
                        >
                          <Eye className="size-3.5" />
                        </button>

                        {/* Direct Quick Edit Action Button */}
                        {onEditSchedule && (
                          <button
                            type="button"
                            onClick={() => onEditSchedule(evt)}
                            className="p-1 rounded-md text-slate-400 hover:text-[#005596] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Edit Jadwal"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        )}

                        {/* Direct Quick Delete Action Button */}
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteEvent(evt)}
                          className="p-1 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          title="Hapus Jadwal"
                        >
                          <Trash2 className="size-3.5" />
                        </button>

                        {/* 3 Dots Menu Button */}
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === evt.id ? null : evt.id)}
                          className="p-1 rounded-md text-slate-500 hover:text-[#0A2540] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="size-4" />
                        </button>

                        {/* Floating 3 Dots Menu */}
                        {activeMenuId === evt.id && (
                          <div className="absolute right-4 top-full mt-1 z-30 w-44 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-zinc-800 shadow-xl py-1 text-xs text-left animate-in fade-in zoom-in-95 duration-100">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setSelectedDetailEvent(evt);
                              }}
                              className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer font-medium"
                            >
                              <Eye className="size-3 text-[#00A2E9]" />
                              <span>Lihat Detail Agenda</span>
                            </button>
                            {onEditSchedule && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onEditSchedule(evt);
                                }}
                                className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              >
                                <Pencil className="size-3 text-slate-500" />
                                <span>Edit Jadwal</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setConfirmDeleteEvent(evt);
                              }}
                              className="w-full px-3 py-1.5 flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer font-medium"
                            >
                              <Trash2 className="size-3" />
                              <span>Hapus Jadwal</span>
                            </button>

                            <div className="h-px bg-slate-100 dark:bg-zinc-800 my-1" />
                            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Ubah Status
                            </div>
                            <button
                              type="button"
                              onClick={() => handleQuickUpdateStatus(evt.id, 'Terjadwal')}
                              className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 transition-colors cursor-pointer text-[11px]"
                            >
                              <CheckCircle2 className="size-3 text-emerald-500" />
                              <span>Tandai Terjadwal</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickUpdateStatus(evt.id, 'Selesai')}
                              className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-700 dark:text-zinc-200 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 transition-colors cursor-pointer text-[11px]"
                            >
                              <Clock4 className="size-3 text-blue-500" />
                              <span>Tandai Selesai</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickUpdateStatus(evt.id, 'Berubah')}
                              className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-700 dark:text-zinc-200 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 transition-colors cursor-pointer text-[11px]"
                            >
                              <AlertCircle className="size-3 text-amber-500" />
                              <span>Tandai Berubah</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickUpdateStatus(evt.id, 'Batal')}
                              className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-700 dark:text-zinc-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 transition-colors cursor-pointer text-[11px]"
                            >
                              <Ban className="size-3 text-rose-500" />
                              <span>Tandai Batal</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal / Backdrop */}
      {confirmDeleteEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0E0E0E] p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
              <div className="size-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0A2540] dark:text-white">
                  Konfirmasi Hapus Jadwal
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus jadwal{' '}
              <strong className="text-[#0A2540] dark:text-white">
                &quot;{confirmDeleteEvent.title}&quot;
              </strong>{' '}
              pada tanggal {formatEventDate(confirmDeleteEvent.date)}? Saldo lembur teknisi terkait
              akan dihitung ulang secara otomatis.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setConfirmDeleteEvent(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-black text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteEvent.id)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  'Ya, Hapus Jadwal'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Pagination Controls matching Gambar 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 text-xs text-slate-600 dark:text-zinc-400">
        {/* Left: Rows per page selector */}
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <div className="relative">
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="appearance-none pl-3 pr-7 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black text-xs font-semibold text-[#1E293B] dark:text-white hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:border-[#00A2E9] cursor-pointer shadow-2xs"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Right: Item range and numeric page buttons */}
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-500 dark:text-zinc-400">
            {totalItems === 0 ? '0 of 0' : `${startIndex + 1}-${endIndex} of ${totalItems}`}
          </span>

          <div className="flex items-center gap-1">
            {/* Prev button */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md text-slate-400 hover:text-[#0A2540] dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>

            {/* Page number buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`size-7 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                    isActive
                      ? 'bg-white dark:bg-zinc-800 text-[#0A2540] dark:text-white font-extrabold border border-slate-200 dark:border-zinc-700 shadow-2xs'
                      : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next button */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 rounded-md text-slate-400 hover:text-[#0A2540] dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Detail Modal */}
      <ScheduleDetailModal
        isOpen={selectedDetailEvent !== null}
        onClose={() => setSelectedDetailEvent(null)}
        event={selectedDetailEvent}
        onEditSchedule={(evt) => {
          setSelectedDetailEvent(null);
          if (onEditSchedule) onEditSchedule(evt);
        }}
        onDeleteSchedule={(evt) => {
          setSelectedDetailEvent(null);
          setConfirmDeleteEvent(evt);
        }}
        onDataRefreshed={(data) => {
          if (onDataRefreshed) onDataRefreshed(data);
        }}
      />
    </div>
  );
}
