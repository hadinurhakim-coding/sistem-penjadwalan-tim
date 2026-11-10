'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  Plus,
  Pencil,
  X,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DayAgendaModal } from '@/components/scheduler/DayAgendaModal';
import { OvertimeEvent } from '@/types/overtime';

interface MonthlyCalendarViewProps {
  events: OvertimeEvent[];
  onOpenAddModal: (preselectedDate?: string) => void;
  onEditSchedule?: (event: OvertimeEvent) => void;
  onDataRefreshed?: (refreshedData: any) => void;
  onExportCSV: () => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS_OF_WEEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function MonthlyCalendarView({
  events,
  onOpenAddModal,
  onEditSchedule,
  onDataRefreshed,
  onExportCSV,
}: MonthlyCalendarViewProps) {
  // Defaults to current month
  const [currentDate, setCurrentDate] = React.useState<Date>(() => new Date());
  const [activePopoverEvent, setActivePopoverEvent] = React.useState<OvertimeEvent | null>(null);
  const [selectedAgendaDate, setSelectedAgendaDate] = React.useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Tanggal hari ini (Today) dalam format YYYY-MM-DD
  const todayDateString = React.useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar math for 7x5 or 7x6 grid
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarCells: {
    dayNumber: number;
    isCurrentMonth: boolean;
    dateString: string;
  }[] = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, d);
    calendarCells.push({
      dayNumber: d,
      isCurrentMonth: false,
      dateString: prevDate.toISOString().split('T')[0],
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dayNumber: d,
      isCurrentMonth: true,
      dateString,
    });
  }

  // Next month leading days (fill to 35)
  const totalCells = calendarCells.length <= 35 ? 35 : 42;
  const nextMonthCount = totalCells - calendarCells.length;
  for (let d = 1; d <= nextMonthCount; d++) {
    const nextDate = new Date(year, month + 1, d);
    calendarCells.push({
      dayNumber: d,
      isCurrentMonth: false,
      dateString: nextDate.toISOString().split('T')[0],
    });
  }

  // Map events by dateString
  const eventsByDate = React.useMemo(() => {
    const map: Record<string, OvertimeEvent[]> = {};
    events.forEach((evt) => {
      if (!map[evt.date]) {
        map[evt.date] = [];
      }
      map[evt.date].push(evt);
    });
    return map;
  }, [events]);

  return (
    <div className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-2xs">
      {/* Container Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <h2 className="text-sm sm:text-base font-extrabold text-[#005596] tracking-tight">
          Kalender Penjadwalan Shift & Lembur
        </h2>

        <Button
          variant="outline"
          size="sm"
          onClick={onExportCSV}
          className="h-8 rounded-lg px-3 text-xs font-semibold text-[#005596] gap-1.5 border-slate-200 hover:bg-[#F4F7FA] hover:border-[#00A2E9] shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Upload className="size-3.5 text-[#00A2E9] rotate-180" />
          <span>Ekspor CSV</span>
        </Button>
      </div>

      {/* Subheader Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-3">
        {/* Left: Badge Kalender PLN Icon Plus + Bulan Tahun */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center w-10 h-11 rounded-lg border border-[#00A2E9]/40 bg-white overflow-hidden shadow-2xs">
            <div className="w-full bg-gradient-to-r from-[#005596] to-[#00A2E9] py-0.5 flex justify-center gap-0.5">
              <span className="size-1 rounded-full bg-[#FFD100] inline-block"></span>
              <span className="size-1 rounded-full bg-[#FFD100] inline-block"></span>
              <span className="size-1 rounded-full bg-[#FFD100] inline-block"></span>
              <span className="size-1 rounded-full bg-[#FFD100] inline-block"></span>
            </div>
            <span className="text-sm font-black text-[#005596] leading-none pt-1">
              {new Date().getDate()}
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-[#005596] tracking-tight leading-none">
              {MONTH_NAMES[month]} {year}
            </h3>
            <p className="text-[11px] text-[#64748B] font-medium mt-1">
              1 {MONTH_NAMES[month]} {year} - {daysInMonth} {MONTH_NAMES[month]} {year}
            </p>
          </div>
        </div>

        {/* Right: < Bulan > , Tahun v, + Tambah Jadwal Button */}
        <div className="flex items-center gap-2">
          {/* Month Selector Pill using shadcn Button */}
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5 shadow-2xs hover:border-[#00A2E9]/60 transition-colors">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handlePrevMonth}
              className="size-7 rounded-full text-slate-400 hover:text-[#005596] hover:bg-[#E0F2FE]/50 cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="size-3.5 stroke-[2]" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-3 text-xs font-bold text-[#005596] hover:bg-[#E0F2FE]/50 rounded-full tracking-tight cursor-pointer"
                  />
                }
              >
                <span>{MONTH_NAMES[month]}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-36 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {MONTH_NAMES.map((m, idx) => (
                  <DropdownMenuItem
                    key={m}
                    onClick={() => setCurrentDate(new Date(year, idx, 1))}
                    className={idx === month ? 'font-bold text-[#005596] bg-[#E0F2FE] text-xs' : 'text-xs'}
                  >
                    {m}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleNextMonth}
              className="size-7 rounded-full text-slate-400 hover:text-[#005596] hover:bg-[#E0F2FE]/50 cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="size-3.5 stroke-[2]" />
            </Button>
          </div>

          {/* Year Selector Pill using shadcn DropdownMenu & Button */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full px-3.5 text-xs font-bold text-[#005596] gap-2 border-slate-200 bg-white shadow-2xs hover:bg-[#E0F2FE]/50 hover:border-[#00A2E9]/60 cursor-pointer"
                />
              }
            >
              <span>{year}</span>
              <ChevronDown className="size-3 text-[#00A2E9] stroke-[2.5]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-28 rounded-xl shadow-lg">
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                <DropdownMenuItem
                  key={y}
                  onClick={() => setCurrentDate(new Date(y, month, 1))}
                  className={y === year ? 'font-bold text-[#005596] bg-[#E0F2FE] text-xs' : 'text-xs'}
                >
                  {y}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tambah Jadwal Button (Electric Yellow with Dark Navy text) */}
          <Button
            size="sm"
            onClick={() => onOpenAddModal()}
            className="h-8 rounded-lg px-3.5 text-xs font-bold gap-1.5 bg-[#FFD100] hover:bg-[#FACC15] text-[#0A2540] shadow-2xs ml-1 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Tambah Jadwal</span>
          </Button>
        </div>
      </div>

      {/* Calendar Grid Header (Min - Sab) */}
      <div className="grid grid-cols-7 border-t border-b border-slate-200 bg-[#F4F7FA] text-center py-2.5 text-xs font-bold text-[#005596] mt-2">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar 7x5 Matrix */}
      <div className="grid grid-cols-7 border-b border-l border-gray-200">
        {calendarCells.map((cell, index) => {
          const dayEvents = eventsByDate[cell.dateString] || [];
          // Tanda aktif lingkaran hanya pada tanggal hari ini (Today)
          const isHighlightedDay = cell.isCurrentMonth && cell.dateString === todayDateString;

          return (
            <div
              key={index}
              onClick={() => setSelectedAgendaDate(cell.dateString)}
              className={`min-h-[115px] sm:min-h-[125px] p-2 border-r border-b border-slate-200 dark:border-zinc-800 relative flex flex-col justify-between transition-colors cursor-pointer ${
                isHighlightedDay
                  ? 'bg-[#F0F9FF] dark:bg-zinc-900/70 hover:bg-[#E0F2FE]/80 dark:hover:bg-zinc-800'
                  : cell.isCurrentMonth
                  ? 'bg-white hover:bg-[#F0F9FF]/80 dark:bg-black dark:hover:bg-zinc-900'
                  : 'bg-[#F8FAFC] text-slate-300 dark:bg-[#050505] dark:text-zinc-600'
              }`}
            >
              {/* Day Number */}
              <div className="flex items-center justify-start">
                {isHighlightedDay ? (
                  <span className="size-5 rounded-full bg-gradient-to-r from-[#005596] to-[#00A2E9] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                    {cell.dayNumber}
                  </span>
                ) : (
                  <span
                    className={`text-xs font-semibold ${
                      cell.isCurrentMonth ? 'text-[#0A2540] dark:text-white' : 'text-slate-300 dark:text-zinc-600'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                )}
              </div>

              {/* Event Pills inside Day Cell */}
              <div className="mt-1 space-y-1 flex-1">
                {dayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAgendaDate(cell.dateString);
                    }}
                    className="border-l-[3.5px] border-[#00A2E9] bg-[#F0F9FF] hover:bg-[#E0F2FE] text-left px-2 py-1 rounded-r transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="text-[11px] font-bold text-[#0A2540] leading-tight truncate">
                      {evt.title}
                    </div>
                    <div className="text-[10px] text-[#005596] font-semibold leading-tight truncate mt-0.5">
                      {evt.time || '17:00 - 21:00'}
                    </div>
                    {evt.assignedMemberNames && evt.assignedMemberNames.length > 0 && (
                      <div className="text-[9.5px] text-[#005596] font-medium truncate mt-0.5">
                        👤 {evt.assignedMemberNames.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Detailed Popover matching frame_45s.jpg */}
      {activePopoverEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-2xs">
          <div className="relative w-full max-w-xs sm:max-w-sm rounded-xl bg-white p-5 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-100">
            {/* Popover Header */}
            <div className="flex items-start justify-between pb-2.5">
              <h4 className="text-sm font-bold text-gray-950 tracking-tight">
                {activePopoverEvent.title || 'UK Returnees Group A'}
              </h4>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => alert(`Edit: ${activePopoverEvent.title}`)}
                  className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => setActivePopoverEvent(null)}
                  className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 py-1">
              <span className="text-xs text-[#64748B] font-normal">Status:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E0F2FE] text-[#005596] border border-[#00A2E9]/40">
                {activePopoverEvent.status === 'Completed'
                  ? 'Selesai'
                  : activePopoverEvent.status === 'In Progress'
                  ? 'Sedang Berjalan'
                  : 'Sesi Terjadwal'}
              </span>
            </div>

            {/* Fields matching simplified structure */}
            <div className="pt-2 space-y-2 text-xs text-gray-700">
              <div className="flex items-baseline justify-between">
                <span className="text-[#64748B] text-xs font-normal">Tanggal:</span>
                <span className="font-semibold text-[#005596]">
                  {new Date(activePopoverEvent.date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-[#64748B] text-xs font-normal">Jam:</span>
                <span className="font-semibold text-[#0A2540]">
                  {activePopoverEvent.time || '17:00 - 21:00'} ({activePopoverEvent.durationHours || 4} Jam)
                </span>
              </div>

              {activePopoverEvent.agenda && (
                <div className="pt-1 border-t border-slate-100">
                  <span className="text-[#64748B] text-[11px] block font-normal">Agenda / Kegiatan:</span>
                  <p className="font-medium text-[#1E293B] text-xs mt-0.5 whitespace-pre-wrap">
                    {activePopoverEvent.agenda}
                  </p>
                </div>
              )}

              <div className="pt-1 border-t border-slate-100">
                <span className="text-[#64748B] text-[11px] block font-normal">
                  Tim yang Ditugaskan ({activePopoverEvent.assignedMemberNames.length} Personil):
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {activePopoverEvent.assignedMemberNames.map((name, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#005596] border border-[#00A2E9]/40 text-[11px] font-semibold"
                    >
                      👤 {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-4 border-t border-slate-100 flex justify-end mt-2">
              <button
                onClick={() => setActivePopoverEvent(null)}
                className="px-4 py-1.5 rounded-lg bg-[#005596] hover:bg-[#004275] text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day Agenda Modal (Buka Daftar Agenda saat klik tanggal di kolom kalender) */}
      <DayAgendaModal
        isOpen={!!selectedAgendaDate}
        dateString={selectedAgendaDate}
        events={events}
        onClose={() => setSelectedAgendaDate(null)}
        onOpenCreateSchedule={(dateStr) => {
          setSelectedAgendaDate(null);
          onOpenAddModal(dateStr);
        }}
        onEditSchedule={(evt) => {
          setSelectedAgendaDate(null);
          onEditSchedule?.(evt);
        }}
        onDataRefreshed={onDataRefreshed}
      />
    </div>
  );
}
