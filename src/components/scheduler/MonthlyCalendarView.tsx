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
  MapPin,
  UserCheck,
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
import { getEffectiveEventStatus } from '@/lib/schedule-utils';

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
  const [selectedMobileDate, setSelectedMobileDate] = React.useState<string | null>(null);

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

  // Format Indonesian date for mobile agenda header
  const formatMobileSelectedDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

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
    <div className="relative rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#0A0A0A] p-3.5 sm:p-6 shadow-2xs transition-colors">
      {/* Container Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <h2 className="text-sm sm:text-base font-extrabold text-[#005596] dark:text-white tracking-tight">
          Kalender Penjadwalan Shift & Lembur
        </h2>

        <Button
          variant="outline"
          size="sm"
          onClick={onExportCSV}
          className="h-8 rounded-lg px-3 text-xs font-semibold text-[#005596] dark:text-[#38BDF8] gap-1.5 border-slate-200 dark:border-zinc-800 hover:bg-[#F4F7FA] dark:hover:bg-zinc-900 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Upload className="size-3.5 text-[#00A2E9] rotate-180" />
          <span>Ekspor CSV</span>
        </Button>
      </div>

      {/* Subheader Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 py-3">
        {/* Left: Badge Kalender PLN Icon Plus + Bulan Tahun */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center w-10 h-11 rounded-lg border border-[#00A2E9]/40 bg-white dark:bg-black overflow-hidden shadow-2xs">
            <div className="w-full bg-gradient-to-r from-[#005596] to-[#00A2E9] py-0.5 flex justify-center gap-0.5">
              <span className="size-1 rounded-full bg-[#FFD100] inline-block"></span>
              <span className="size-1 rounded-full bg-[#FFD100] inline-block"></span>
              <span className="size-1 rounded-full bg-[#FFD100] inline-block"></span>
              <span className="size-1 rounded-full bg-[#FFD100] inline-block"></span>
            </div>
            <span className="text-sm font-black text-[#005596] dark:text-[#38BDF8] leading-none pt-1">
              {new Date().getDate()}
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-[#005596] dark:text-white tracking-tight leading-none">
              {MONTH_NAMES[month]} {year}
            </h3>
            <p className="text-[11px] text-[#64748B] dark:text-zinc-400 font-medium mt-1">
              1 {MONTH_NAMES[month]} {year} - {daysInMonth} {MONTH_NAMES[month]} {year}
            </p>
          </div>
        </div>

        {/* Right: < Bulan > , Tahun v, + Tambah Jadwal Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector Pill using shadcn Button */}
          <div className="inline-flex items-center rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-0.5 shadow-2xs hover:border-[#00A2E9]/60 transition-colors">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handlePrevMonth}
              className="size-7 rounded-full text-slate-400 hover:text-[#005596] hover:bg-[#E0F2FE]/50 dark:hover:bg-zinc-800 cursor-pointer"
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
                    className="h-7 px-3 text-xs font-bold text-[#005596] dark:text-[#38BDF8] hover:bg-[#E0F2FE]/50 dark:hover:bg-zinc-800 rounded-full tracking-tight cursor-pointer"
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
              className="size-7 rounded-full text-slate-400 hover:text-[#005596] hover:bg-[#E0F2FE]/50 dark:hover:bg-zinc-800 cursor-pointer"
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
                  className="h-8 rounded-full px-3.5 text-xs font-bold text-[#005596] dark:text-zinc-200 gap-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-black shadow-2xs hover:bg-[#E0F2FE]/50 dark:hover:bg-zinc-800 cursor-pointer"
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
            className="h-8 rounded-lg px-3.5 text-xs font-bold gap-1.5 bg-[#FFD100] hover:bg-[#FACC15] text-[#0A2540] shadow-2xs ml-auto sm:ml-1 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Tambah Jadwal</span>
          </Button>
        </div>
      </div>

      {/* Calendar Grid Header (Min - Sab) */}
      <div className="grid grid-cols-7 border-t border-b border-slate-200 dark:border-zinc-800 bg-[#F4F7FA] dark:bg-zinc-900/60 text-center py-2 text-xs font-bold text-[#005596] dark:text-[#38BDF8] mt-2">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar 7x5 Matrix */}
      <div className="grid grid-cols-7 border-b border-l border-slate-200 dark:border-zinc-800">
        {calendarCells.map((cell, index) => {
          const dayEvents = eventsByDate[cell.dateString] || [];
          // Tanda aktif lingkaran hanya pada tanggal hari ini (Today)
          const isHighlightedDay = cell.isCurrentMonth && cell.dateString === todayDateString;
          const isSelectedMobile = (selectedMobileDate || todayDateString) === cell.dateString;

          return (
            <div
              key={index}
              onClick={() => {
                setSelectedMobileDate(cell.dateString);
                // On desktop, open modal on click
                if (typeof window !== 'undefined' && window.innerWidth >= 640) {
                  setSelectedAgendaDate(cell.dateString);
                }
              }}
              className={`min-h-[50px] sm:min-h-[125px] p-1 sm:p-2 border-r border-b border-slate-200 dark:border-zinc-800 relative flex flex-col justify-between transition-all cursor-pointer ${
                isSelectedMobile
                  ? 'bg-[#E0F2FE]/50 dark:bg-zinc-800/80 ring-2 ring-[#00A2E9] ring-inset'
                  : isHighlightedDay
                  ? 'bg-[#F0F9FF] dark:bg-zinc-900/70 hover:bg-[#E0F2FE]/80 dark:hover:bg-zinc-800'
                  : cell.isCurrentMonth
                  ? 'bg-white hover:bg-[#F0F9FF]/80 dark:bg-black dark:hover:bg-zinc-900'
                  : 'bg-[#F8FAFC] text-slate-300 dark:bg-[#050505] dark:text-zinc-600'
              }`}
            >
              {/* Day Number */}
              <div className="flex items-center justify-center sm:justify-start">
                {isHighlightedDay ? (
                  <span className="size-5 rounded-full bg-gradient-to-r from-[#005596] to-[#00A2E9] text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center shadow-xs">
                    {cell.dayNumber}
                  </span>
                ) : (
                  <span
                    className={`text-[11px] sm:text-xs font-semibold ${
                      cell.isCurrentMonth ? 'text-[#0A2540] dark:text-white' : 'text-slate-300 dark:text-zinc-600'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                )}
              </div>

              {/* Mobile Event Dots Indicator (< sm) */}
              <div className="sm:hidden flex items-center justify-center gap-0.5 my-0.5 min-h-[6px]">
                {dayEvents.slice(0, 3).map((evt, idx) => (
                  <span
                    key={idx}
                    className={`size-1.5 rounded-full ${
                      evt.taskCategory === 'Tugas Support' ? 'bg-[#00A2E9]' : 'bg-[#005596] dark:bg-[#38BDF8]'
                    }`}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[7px] font-black text-[#005596] dark:text-[#38BDF8] leading-none">+</span>
                )}
              </div>

              {/* Desktop Event Pills (>= sm) */}
              <div className="hidden sm:block mt-1 flex-1">
                {dayEvents.length <= 3 ? (
                  /* Tampilan normal jika 1 s/d 3 agenda */
                  <div className="space-y-1">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAgendaDate(cell.dateString);
                        }}
                        className="border-l-[3.5px] border-[#00A2E9] bg-[#F0F9FF] dark:bg-zinc-900 hover:bg-[#E0F2FE] dark:hover:bg-zinc-800 text-left px-2 py-1 rounded-r transition-all cursor-pointer shadow-2xs"
                      >
                        <div className="text-[11px] font-bold text-[#0A2540] dark:text-white leading-tight truncate">
                          {evt.title}
                        </div>
                        <div className="text-[10px] text-[#005596] dark:text-[#38BDF8] font-semibold leading-tight truncate mt-0.5">
                          {evt.time || '17:00 - 21:00'}
                        </div>
                        {evt.assignedMemberNames && evt.assignedMemberNames.length > 0 && (
                          <div className="text-[9.5px] text-[#005596] dark:text-[#38BDF8] font-medium truncate mt-0.5">
                            👤 {evt.assignedMemberNames.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Komponen Bulatan Bernomor jika lebih dari 3 agenda (contoh 4 agenda: bulatan 1, 2, 3, 4) */
                  <div className="flex flex-col justify-between h-full pt-0.5">
                    <div className="flex flex-wrap items-center gap-1.5 p-1">
                      {dayEvents.map((evt, idx) => {
                        const isSupport = evt.taskCategory === 'Tugas Support';
                        return (
                          <button
                            key={evt.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePopoverEvent(evt);
                            }}
                            title={`Agenda #${idx + 1}: ${evt.title} (${evt.time || '17:00 - 21:00'})${
                              evt.assignedMemberNames?.length ? ` - ${evt.assignedMemberNames.join(', ')}` : ''
                            }`}
                            className={`size-6 sm:size-7 rounded-full flex items-center justify-center font-extrabold text-[11px] transition-all cursor-pointer shadow-2xs hover:scale-115 hover:ring-2 hover:ring-[#FFD100] active:scale-95 ${
                              isSupport
                                ? 'bg-[#00A2E9] text-white hover:bg-[#0087C2]'
                                : 'bg-[#005596] text-white hover:bg-[#003E6E]'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-1 pt-1 border-t border-slate-100 dark:border-zinc-800 text-[10px] text-[#005596] dark:text-[#38BDF8] font-bold flex items-center justify-between px-1">
                      <span>{dayEvents.length} Agenda</span>
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-normal">Klik no.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Dynamic Daily Agenda View (< sm) */}
      <div className="sm:hidden mt-4 pt-3.5 border-t border-slate-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#00A2E9]" />
            <h4 className="text-xs font-extrabold text-[#005596] dark:text-white tracking-tight">
              Agenda: {formatMobileSelectedDate(selectedMobileDate || todayDateString)}
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setSelectedAgendaDate(selectedMobileDate || todayDateString)}
            className="text-[11px] font-bold text-[#00A2E9] hover:underline cursor-pointer"
          >
            Lihat Modal Detail &rarr;
          </button>
        </div>

        {/* Selected date events list */}
        {(() => {
          const activeDate = selectedMobileDate || todayDateString;
          const dayEvts = eventsByDate[activeDate] || [];

          if (dayEvts.length === 0) {
            return (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 p-4 text-center bg-slate-50/50 dark:bg-zinc-900/30">
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Tidak ada agenda kegiatan pada tanggal ini.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenAddModal(activeDate)}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFD100] hover:bg-[#FACC15] text-[#0A2540] text-xs font-bold shadow-2xs cursor-pointer active:scale-95"
                >
                  <Plus className="size-3.5" />
                  <span>Tambah Agenda di Tanggal Ini</span>
                </button>
              </div>
            );
          }

          return (
            <div className="space-y-2.5">
              {dayEvts.map((evt) => {
                const effectiveStatus = getEffectiveEventStatus(evt);
                const isSupport = evt.taskCategory === 'Tugas Support';

                return (
                  <div
                    key={evt.id}
                    className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0E0E0E] p-3.5 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isSupport
                            ? 'bg-[#00A2E9]/10 text-[#00A2E9] dark:text-[#38BDF8] border border-[#00A2E9]/25'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        {evt.taskCategory || 'Tugas Pokok'}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                        {evt.time || '17:00 - 21:00'} ({evt.durationHours || 4} Jam)
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-[#0A2540] dark:text-white leading-snug">
                      {evt.title}
                    </h5>

                    {evt.room && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#005596] dark:text-[#38BDF8] bg-[#E0F2FE]/60 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        <MapPin className="size-2.5 shrink-0" />
                        <span>{evt.room}</span>
                      </div>
                    )}

                    {evt.assignedMemberNames && evt.assignedMemberNames.length > 0 && (
                      <div className="text-[11px] text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 pt-0.5">
                        <UserCheck className="size-3 text-[#00A2E9] shrink-0" />
                        <span className="truncate">{evt.assignedMemberNames.join(', ')}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs">
                      <span className="text-[10px] text-slate-400">
                        Status: <strong className="text-slate-600 dark:text-zinc-300">{effectiveStatus}</strong>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {onEditSchedule && (
                          <button
                            type="button"
                            onClick={() => onEditSchedule(evt)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 text-[11px] font-semibold text-slate-700 dark:text-zinc-200 hover:border-[#00A2E9] cursor-pointer"
                          >
                            <Pencil className="size-3 text-slate-500" />
                            <span>Edit</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedAgendaDate(activeDate)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E0F2FE] dark:bg-zinc-800 text-[11px] font-bold text-[#005596] dark:text-[#38BDF8] cursor-pointer"
                        >
                          <span>Rincian</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Floating Detailed Popover matching frame_45s.jpg */}
      {activePopoverEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-xs sm:max-w-sm rounded-2xl bg-white dark:bg-[#0E0E0E] p-5 shadow-2xl border border-slate-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-100">
            {/* Popover Header */}
            <div className="flex items-start justify-between pb-2.5 border-b border-slate-100 dark:border-zinc-800">
              <h4 className="text-sm font-bold text-[#0A2540] dark:text-white tracking-tight leading-snug">
                {activePopoverEvent.title || 'Agenda Kegiatan'}
              </h4>

              <div className="flex items-center gap-1">
                {onEditSchedule && (
                  <button
                    onClick={() => {
                      const target = activePopoverEvent;
                      setActivePopoverEvent(null);
                      onEditSchedule(target);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#005596] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                    title="Edit Jadwal"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setActivePopoverEvent(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                  title="Tutup"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 py-2">
              <span className="text-xs text-[#64748B] dark:text-zinc-400 font-normal">Status:</span>
              {(() => {
                const effectiveStatus = getEffectiveEventStatus(activePopoverEvent);
                return (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    effectiveStatus === 'Batal'
                      ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60'
                      : effectiveStatus === 'Berubah'
                      ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60'
                      : effectiveStatus === 'Completed' || effectiveStatus === 'Selesai'
                      ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'
                  }`}>
                    {effectiveStatus}
                  </span>
                );
              })()}
            </div>

            {/* Fields matching simplified structure */}
            <div className="pt-1 space-y-2 text-xs text-slate-700 dark:text-zinc-300">
              <div className="flex items-baseline justify-between">
                <span className="text-[#64748B] dark:text-zinc-400 text-xs font-normal">Tanggal:</span>
                <span className="font-semibold text-[#005596] dark:text-[#38BDF8]">
                  {new Date(activePopoverEvent.date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-[#64748B] dark:text-zinc-400 text-xs font-normal">Jam:</span>
                <span className="font-semibold text-[#0A2540] dark:text-white">
                  {activePopoverEvent.time || '17:00 - 21:00'} ({activePopoverEvent.durationHours || 4} Jam)
                </span>
              </div>

              {activePopoverEvent.room && (
                <div className="flex items-baseline justify-between">
                  <span className="text-[#64748B] dark:text-zinc-400 text-xs font-normal">Lokasi:</span>
                  <span className="font-semibold text-[#005596] dark:text-[#38BDF8]">
                    📍 {activePopoverEvent.room}
                  </span>
                </div>
              )}

              {activePopoverEvent.agenda && (
                <div className="pt-1.5 border-t border-slate-100 dark:border-zinc-800">
                  <span className="text-[#64748B] dark:text-zinc-400 text-[11px] block font-normal">Uraian Tugas / Agenda:</span>
                  <p className="font-medium text-[#1E293B] dark:text-white text-xs mt-0.5 whitespace-pre-wrap">
                    {activePopoverEvent.agenda}
                  </p>
                </div>
              )}

              <div className="pt-1.5 border-t border-slate-100 dark:border-zinc-800">
                <span className="text-[#64748B] dark:text-zinc-400 text-[11px] block font-normal">
                  Tim yang Ditugaskan ({activePopoverEvent.assignedMemberNames.length} Personil):
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {activePopoverEvent.assignedMemberNames.map((name, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-[#E0F2FE] dark:bg-zinc-800 text-[#005596] dark:text-[#38BDF8] border border-[#00A2E9]/40 dark:border-zinc-700 text-[11px] font-semibold"
                    >
                      👤 {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-3.5 border-t border-slate-100 dark:border-zinc-800 flex justify-end mt-2">
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
