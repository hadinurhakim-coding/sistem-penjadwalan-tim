'use client';

import * as React from 'react';
import {
  CalendarDays,
  User,
  Users,
  CheckCircle2,
  Briefcase,
  HelpCircle,
  Clock,
  Info,
  ChevronDown,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { Member, OvertimeEvent, TaskCategory } from '@/types/overtime';

interface TeamContributionHeatmapProps {
  members: Member[];
  events: OvertimeEvent[];
  onOpenAddSchedule?: () => void;
}

interface DayEventDetail {
  id: string;
  title: string;
  category: TaskCategory;
  hours: number;
  assignedMemberIds: string[];
  assignedMemberNames: string[];
  time?: string;
  isCustom?: boolean;
}

interface DayCell {
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: number; // 0=Mon, ..., 6=Sun
  dayOfMonth: number;
  month: number; // 0-11
  year: number;
  formattedIndoDate: string;
  totalHours: number;
  tugasPokokHours: number;
  tugasSupportHours: number;
  sessionCount: number;
  level: 0 | 1 | 2 | 3 | 4;
  events: DayEventDetail[];
}

const INDO_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const INDO_DAYS_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export function TeamContributionHeatmap({
  members,
  events,
  onOpenAddSchedule,
}: TeamContributionHeatmapProps) {
  const [selectedMemberId, setSelectedMemberId] = React.useState<string>('all');
  const [selectedCategory, setSelectedCategory] = React.useState<'all' | TaskCategory>('all');
  const [hoveredCell, setHoveredCell] = React.useState<DayCell | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to active month (November 2026) on mobile devices
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768 && scrollContainerRef.current) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ left: 560, behavior: 'smooth' });
        }
      }, 300);
    }
  }, []);

  // Group real events from database by date
  const eventsByDate = React.useMemo(() => {
    const map: Record<string, DayEventDetail[]> = {};

    events.forEach((evt) => {
      if (!evt.date) return;
      const hours = evt.durationHours || 4;
      const category = (evt.taskCategory as TaskCategory) || 'Tugas Pokok';
      const item: DayEventDetail = {
        id: evt.id,
        title: evt.title,
        category,
        hours,
        assignedMemberIds: evt.assignedMemberIds || [],
        assignedMemberNames: evt.assignedMemberNames || [],
        time: evt.time || `${evt.startTime || '17:00'} - ${evt.endTime || '21:00'}`,
        isCustom: true,
      };

      if (!map[evt.date]) {
        map[evt.date] = [item];
      } else {
        map[evt.date].push(item);
      }
    });

    return map;
  }, [events]);

  // Build the 53 weeks grid for the year 2026 based purely on database events
  const { weeksGrid, monthHeaders, totalContributions, stats } = React.useMemo(() => {
    // Start on the Monday of the first week of 2026: Dec 29, 2025
    const startCalendar = new Date(2025, 11, 29);
    const weeks: DayCell[][] = [];
    const headers: { weekIndex: number; monthName: string }[] = [];
    let lastMonth = -1;

    let totalCont = 0;
    let totalHrs = 0;
    let totalTugasPokokHrs = 0;
    let totalTugasSupportHrs = 0;
    let totalTugasPokokSessions = 0;
    let totalTugasSupportSessions = 0;
    let totalWeekdayHrs = 0;
    let totalWeekendHrs = 0;

    for (let w = 0; w < 53; w++) {
      const currentWeek: DayCell[] = [];

      // Check mid-week for month header label
      const midDay = new Date(startCalendar);
      midDay.setDate(startCalendar.getDate() + w * 7 + 3);
      if (midDay.getFullYear() === 2026 && midDay.getMonth() !== lastMonth) {
        headers.push({ weekIndex: w, monthName: INDO_MONTHS_SHORT[midDay.getMonth()] });
        lastMonth = midDay.getMonth();
      }

      for (let d = 0; d < 7; d++) {
        const dateObj = new Date(startCalendar);
        dateObj.setDate(startCalendar.getDate() + w * 7 + d);

        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${day}`;
        const dayOfWeek = (dateObj.getDay() + 6) % 7; // 0 = Mon ... 6 = Sun

        const dayEvents = eventsByDate[dateStr] || [];

        // Filter events by selected member & category
        const filteredEvents = dayEvents.filter((ev) => {
          const memberMatch =
            selectedMemberId === 'all' || ev.assignedMemberIds.includes(selectedMemberId);
          const categoryMatch =
            selectedCategory === 'all' || ev.category === selectedCategory;
          return memberMatch && categoryMatch;
        });

        const dayTotalHours = filteredEvents.reduce((acc, ev) => acc + ev.hours, 0);
        const dayPokokHours = filteredEvents
          .filter((ev) => ev.category === 'Tugas Pokok')
          .reduce((acc, ev) => acc + ev.hours, 0);
        const daySupportHours = filteredEvents
          .filter((ev) => ev.category === 'Tugas Support')
          .reduce((acc, ev) => acc + ev.hours, 0);

        // Skala intensitas warna dot heatmap (berdasarkan aturan jam beban kerja):
        // Level 0 (Putih / Kosong): 0 jam
        // Level 1 / "color level 2 (setelah putih)": 1 - 3 jam
        // Level 3 / "color level 3": 4 - 8 jam (standar 1 - 2 sesi lembur @ 4 jam)
        // Level 4 / "color level 4 (selebihnya)": > 8 jam (sangat padat / lembur maraton)
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (dayTotalHours > 8 || filteredEvents.length >= 3) {
          level = 4; // Selebihnya (> 8 Jam) -> Biru Pekat Navy (#005596)
        } else if (dayTotalHours >= 4 || filteredEvents.length >= 2) {
          level = 3; // 4 - 8 Jam -> Biru Cyan Primary (#00A2E9)
        } else if (dayTotalHours >= 1 || filteredEvents.length === 1) {
          level = 1; // 1 - 3 Jam -> Biru Muda Halus setelah warna putih (#BAE6FD)
        } else {
          level = 0; // 0 Jam -> Putih / Abu-abu
        }

        if (filteredEvents.length > 0) {
          totalCont += filteredEvents.length;
          totalHrs += dayTotalHours;
          totalTugasPokokHrs += dayPokokHours;
          totalTugasSupportHrs += daySupportHours;

          totalTugasPokokSessions += filteredEvents.filter((ev) => ev.category === 'Tugas Pokok').length;
          totalTugasSupportSessions += filteredEvents.filter((ev) => ev.category === 'Tugas Support').length;

          if (dayOfWeek >= 5) {
            totalWeekendHrs += dayTotalHours;
          } else {
            totalWeekdayHrs += dayTotalHours;
          }
        }

        const indoDayName = INDO_DAYS_SHORT[dayOfWeek];
        const formattedIndoDate = `${indoDayName}, ${dateObj.getDate()} ${INDO_MONTHS_SHORT[dateObj.getMonth()]} ${y}`;

        currentWeek.push({
          dateStr,
          dayOfWeek,
          dayOfMonth: dateObj.getDate(),
          month: dateObj.getMonth(),
          year: y,
          formattedIndoDate,
          totalHours: dayTotalHours,
          tugasPokokHours: dayPokokHours,
          tugasSupportHours: daySupportHours,
          sessionCount: filteredEvents.length,
          level,
          events: filteredEvents,
        });
      }

      weeks.push(currentWeek);
    }

    // Dynamic Proportions
    const totalRecordedHours = totalTugasPokokHrs + totalTugasSupportHrs;
    const hasData = totalRecordedHours > 0;
    const pokokPct = hasData ? Math.round((totalTugasPokokHrs / totalRecordedHours) * 100) : 0;
    const supportPct = hasData ? 100 - pokokPct : 0;

    const weekdayEffective = totalWeekdayHrs + totalWeekendHrs;
    const weekdayPct = weekdayEffective > 0 ? Math.round((totalWeekdayHrs / weekdayEffective) * 100) : 0;
    const weekendPct = weekdayEffective > 0 ? 100 - weekdayPct : 0;

    return {
      weeksGrid: weeks,
      monthHeaders: headers,
      totalContributions: totalCont,
      stats: {
        hasData,
        totalHours: totalHrs,
        totalTugasPokokHrs,
        totalTugasSupportHrs,
        totalTugasPokokSessions,
        totalTugasSupportSessions,
        pokokPct,
        supportPct,
        weekdayPct,
        weekendPct,
        totalWeekdayHrs,
        totalWeekendHrs,
      },
    };
  }, [eventsByDate, selectedMemberId, selectedCategory]);

  // Selected member name
  const currentMemberName =
    selectedMemberId === 'all'
      ? 'Seluruh Tim Multimedia'
      : members.find((m) => m.id === selectedMemberId)?.name || 'Teknisi';

  // Heatmap square color mapper using official PLN Icon Plus tones
  const getCellColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-[#BAE6FD] hover:ring-2 hover:ring-[#00A2E9]'; // Level 1 (Setelah warna putih): 1 - 3 Jam
      case 2:
      case 3:
        return 'bg-[#00A2E9] hover:ring-2 hover:ring-[#FFD100]'; // Level 3: 4 - 8 Jam (Standar 1 - 2 Sesi)
      case 4:
        return 'bg-[#005596] hover:ring-2 hover:ring-[#FFD100]'; // Level 4: > 8 Jam (Selebihnya / Sangat Padat)
      default:
        return 'bg-slate-100 dark:bg-zinc-800/60 hover:bg-slate-200 dark:hover:bg-zinc-700'; // Level 0: 0 Jam (Putih / Kosong)
    }
  };

  // 4-Axis Chart Calculations
  // Center is (130, 110), Radius = 72
  const cx = 130;
  const cy = 110;
  const maxR = 72;

  // Clamped percentage factors for nice visibility
  const hasData = stats.hasData;
  const topFactor = hasData ? Math.max(0.12, stats.pokokPct / 100) : 0.15;
  const bottomFactor = hasData ? Math.max(0.12, stats.supportPct / 100) : 0.15;
  const leftFactor = (stats.totalWeekdayHrs + stats.totalWeekendHrs > 0) ? Math.max(0.12, stats.weekdayPct / 100) : 0.15;
  const rightFactor = (stats.totalWeekdayHrs + stats.totalWeekendHrs > 0) ? Math.max(0.12, stats.weekendPct / 100) : 0.15;

  const topPoint = { x: cx, y: cy - topFactor * maxR };
  const bottomPoint = { x: cx, y: cy + bottomFactor * maxR };
  const leftPoint = { x: cx - leftFactor * maxR, y: cy };
  const rightPoint = { x: cx + rightFactor * maxR, y: cy };

  const polygonPoints = `${topPoint.x},${topPoint.y} ${rightPoint.x},${rightPoint.y} ${bottomPoint.x},${bottomPoint.y} ${leftPoint.x},${leftPoint.y}`;

  // Dynamic distribution status text based on real database proportions
  let statusText = 'Belum Ada Penugasan';
  let statusClass = 'text-slate-500 bg-slate-100 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';

  if (hasData) {
    if (stats.pokokPct >= 40 && stats.pokokPct <= 85) {
      statusText = 'Rotasi Ideal Sesuai Jobdesk';
      statusClass = 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60';
    } else if (stats.pokokPct > 85) {
      statusText = 'Dominan Tugas Pokok';
      statusClass = 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60';
    } else {
      statusText = 'Dominan Tugas Support';
      statusClass = 'text-cyan-600 bg-cyan-50 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800/60';
    }
  }

  // Filtered recent activities from real database events
  const recentEvents = React.useMemo(() => {
    return events
      .filter((evt) => {
        const memberMatch =
          selectedMemberId === 'all' || evt.assignedMemberIds?.includes(selectedMemberId);
        const categoryMatch =
          selectedCategory === 'all' || evt.taskCategory === selectedCategory;
        return memberMatch && categoryMatch;
      })
      .slice(0, 3);
  }, [events, selectedMemberId, selectedCategory]);

  return (
    <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-slate-200/90 dark:border-[#1F1F1F] shadow-xs p-5 sm:p-6 transition-all">
      {/* Top Bar: Title, Count, Multi-Role Switcher, Category Filter & Year */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-[#1F1F1F]">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[#005596] dark:text-white tracking-tight">
              {totalContributions} Kontribusi Penugasan pada Tahun 2026
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#00A2E9]/10 text-[#005596] dark:text-[#38BDF8] px-2.5 py-0.5 rounded-full border border-[#00A2E9]/30">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00A2E9] dark:text-[#38BDF8]" />
              {selectedMemberId === 'all' ? 'Pratinjau Multi-Role (Semua Akun)' : `Akun: ${currentMemberName}`}
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-1 font-medium">
            Visualisasi dot beban penugasan otomatis & adil. Terbagi atas{' '}
            <strong className="text-[#005596] dark:text-white">Tugas Pokok (Tupoksi)</strong> dan{' '}
            <strong className="text-[#00A2E9] dark:text-[#38BDF8]">Tugas Support (Perbantuan)</strong>.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Account Selector Dropdown */}
          <div className="relative inline-flex items-center">
            <div className="absolute left-2.5 pointer-events-none text-[#64748B] dark:text-zinc-400">
              {selectedMemberId === 'all' ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5 text-[#005596] dark:text-[#38BDF8]" />}
            </div>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="appearance-none pl-8 pr-7 py-1.5 bg-[#F4F7FA] dark:bg-black hover:bg-slate-100 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-[#1E293B] dark:text-white rounded-lg cursor-pointer focus:outline-none focus:border-[#00A2E9] focus:ring-1 focus:ring-[#00A2E9] transition-colors shadow-2xs"
            >
              <option value="all">👥 Seluruh Tim (Akumulasi)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  👤 {m.name} ({m.role.replace('Engineer ', '')})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 pointer-events-none text-[#64748B] dark:text-zinc-400" />
          </div>

          {/* Category Filter Segments */}
          <div className="inline-flex rounded-lg bg-[#F4F7FA] dark:bg-black p-0.5 border border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-[#005596] dark:text-white shadow-xs'
                  : 'text-[#64748B] dark:text-zinc-400 hover:text-[#1E293B] dark:hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('Tugas Pokok')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                selectedCategory === 'Tugas Pokok'
                  ? 'bg-[#005596] text-white shadow-xs'
                  : 'text-[#64748B] dark:text-zinc-400 hover:text-[#1E293B] dark:hover:text-white'
              }`}
            >
              Tupoksi
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('Tugas Support')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                selectedCategory === 'Tugas Support'
                  ? 'bg-[#00A2E9] text-white shadow-xs'
                  : 'text-[#64748B] dark:text-zinc-400 hover:text-[#1E293B] dark:hover:text-white'
              }`}
            >
              Support
            </button>
          </div>

          {/* Year Badge */}
          <div className="bg-[#005596] dark:bg-zinc-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            2026
          </div>
        </div>
      </div>

      {/* Mobile Hint & Quick Focus to Active Month */}
      <div className="md:hidden flex items-center justify-between gap-2 pt-2.5 text-[11px] text-[#64748B] dark:text-zinc-400">
        <span className="flex items-center gap-1 font-medium">
          <span>👉</span>
          <span>Geser untuk bulan lain</span>
        </span>
        <button
          type="button"
          onClick={() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTo({ left: 560, behavior: 'smooth' });
            }
          }}
          className="px-2.5 py-1 rounded-lg bg-[#E0F2FE] dark:bg-zinc-800 text-[#005596] dark:text-[#38BDF8] font-bold text-[10px] cursor-pointer hover:bg-[#005596] hover:text-white transition-all shadow-2xs active:scale-95"
        >
          📍 Fokus Nov 2026
        </button>
      </div>

      {/* Contribution Calendar Grid */}
      <div ref={scrollContainerRef} className="pt-3 overflow-x-auto select-none no-scrollbar">
        <div className="min-w-[780px]">
          {/* Month Labels Bar */}
          <div className="flex text-[10px] text-[#64748B] dark:text-zinc-400 font-semibold pl-8 mb-1.5">
            <div
              className="w-full"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(53, 11.5px)', gap: '3px' }}
            >
              {Array.from({ length: 53 }).map((_, wIdx) => {
                const header = monthHeaders.find((h) => h.weekIndex === wIdx);
                return (
                  <div key={wIdx} className="h-4 relative">
                    {header && (
                      <span className="absolute left-0 top-0 whitespace-nowrap">
                        {header.monthName}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Rows: 7 days x 53 weeks */}
          <div className="flex items-start gap-2">
            {/* Day of Week Labels (Sen, Rab, Jum) */}
            <div
              className="flex flex-col justify-between text-[9px] text-[#64748B] dark:text-zinc-400 font-medium pr-1 w-6 text-right select-none"
              style={{ height: 'calc(7 * 11.5px + 6 * 3px)' }}
            >
              <span className="leading-none">Sen</span>
              <span className="leading-none opacity-0">Sel</span>
              <span className="leading-none">Rab</span>
              <span className="leading-none opacity-0">Kam</span>
              <span className="leading-none">Jum</span>
              <span className="leading-none opacity-0">Sab</span>
              <span className="leading-none opacity-0">Min</span>
            </div>

            {/* Matrix of Dots */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(53, 11.5px)',
                gridTemplateRows: 'repeat(7, 11.5px)',
                gridAutoFlow: 'column',
                gap: '3px',
              }}
            >
              {weeksGrid.map((week, wIdx) =>
                week.map((cell, dIdx) => (
                  <div
                    key={`${wIdx}-${dIdx}`}
                    onMouseEnter={() => setHoveredCell(cell)}
                    className={`w-[11.5px] h-[11.5px] rounded-[2px] transition-all cursor-pointer ${getCellColor(
                      cell.level
                    )}`}
                    title={`${cell.formattedIndoDate}: ${
                      cell.totalHours > 0
                        ? `${cell.sessionCount} Agenda (${cell.totalHours} Jam)`
                        : 'Tidak ada agenda kegiatan'
                    }`}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sub-bar below Grid: Fairness Info + Legend */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-[#64748B] dark:text-zinc-400 pt-3.5 mt-2 border-t border-slate-100 dark:border-[#1F1F1F] gap-3">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#00A2E9]" />
              <span>Sistem rotasi lembur bergulir adil (Standar 4 Jam/Sesi)</span>
            </div>

            {/* GitHub-style Legend with PLN Icon Plus Palette */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-[#64748B] dark:text-zinc-400">Kurang</span>
              <div
                className="w-3 h-3 rounded-[2px] bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                title="Level 0: 0 Jam (Kosong / Tidak Ada Agenda)"
              />
              <div
                className="w-3 h-3 rounded-[2px] bg-[#BAE6FD]"
                title="Level 1: 1 - 3 Jam (Setelah warna putih)"
              />
              <div
                className="w-3 h-3 rounded-[2px] bg-[#00A2E9]"
                title="Level 3: 4 - 8 Jam (Standar 1 - 2 Sesi)"
              />
              <div
                className="w-3 h-3 rounded-[2px] bg-[#005596]"
                title="Level 4: > 8 Jam (Selebihnya / Sangat Padat)"
              />
              <span className="text-[10px] font-medium text-[#64748B] dark:text-zinc-400">Banyak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating or Hovered Day Detail Banner */}
      {hoveredCell && hoveredCell.totalHours > 0 ? (
        <div className="mt-4 p-3 bg-[#F4F7FA] dark:bg-[#111111] rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-100">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00A2E9]" />
            <div>
              <span className="font-bold text-[#005596] dark:text-[#38BDF8]">{hoveredCell.formattedIndoDate}:</span>{' '}
              <span className="font-semibold text-[#1E293B] dark:text-white">
                {hoveredCell.sessionCount} Sesi Penugasan ({hoveredCell.totalHours} Jam)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hoveredCell.events.map((ev, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                  ev.category === 'Tugas Pokok'
                    ? 'bg-[#005596]/10 text-[#005596] dark:text-white border border-[#005596]/20'
                    : 'bg-[#00A2E9]/10 text-[#00A2E9] dark:text-[#38BDF8] border border-[#00A2E9]/20'
                }`}
              >
                {ev.category}: {ev.title} ({ev.assignedMemberNames.join(', ')})
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Bottom Section: Activity Summary & 4-Axis Task Distribution Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5 pt-5 border-t border-slate-200/80 dark:border-[#1F1F1F]">
        {/* Left Column: Ringkasan Aktivitas (Tugas Pokok vs Tugas Support) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#005596] dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#00A2E9]" />
              Ringkasan Aktivitas: {currentMemberName}
            </h3>
            {onOpenAddSchedule && (
              <button
                type="button"
                onClick={onOpenAddSchedule}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#005596] dark:text-[#38BDF8] hover:text-[#00A2E9] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Penugasan
              </button>
            )}
          </div>

          {/* 2 Main Category Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Tugas Pokok Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-[#F4F7FA]/70 dark:bg-[#050505] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#005596] dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#005596] dark:text-[#38BDF8]" />
                  Tugas Pokok (Tupoksi)
                </span>
                <span className="text-xs font-extrabold text-[#005596] dark:text-white">
                  {stats.pokokPct}%
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-zinc-400 leading-relaxed">
                Pemeliharaan rutin studio multimedia, Live Streaming BOD & RUPS, serta Master AV Control Room.
              </p>
              <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#005596] dark:bg-[#38BDF8] h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.pokokPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-[#1E293B] dark:text-zinc-300 pt-0.5">
                <span>{stats.totalTugasPokokHrs} Jam Kerja</span>
                <span>{stats.totalTugasPokokSessions} Sesi Terlaksana</span>
              </div>
            </div>

            {/* Tugas Support Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-[#F4F7FA]/70 dark:bg-[#050505] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#00A2E9] dark:text-[#38BDF8] flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#00A2E9] dark:text-[#38BDF8]" />
                  Tugas Support (Perbantuan)
                </span>
                <span className="text-xs font-extrabold text-[#00A2E9] dark:text-[#38BDF8]">
                  {stats.supportPct}%
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-zinc-400 leading-relaxed">
                Dukungan teknis vicon Gandul, asistensi insidental lintas unit, pendampingan vendor, dan darurat.
              </p>
              <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#00A2E9] h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.supportPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-[#1E293B] dark:text-zinc-300 pt-0.5">
                <span>{stats.totalTugasSupportHrs} Jam Kerja</span>
                <span>{stats.totalTugasSupportSessions} Sesi Terlaksana</span>
              </div>
            </div>
          </div>

          {/* Quick List of Recent Activities from Real Database */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-[#1E293B] dark:text-white">Aktivitas Penugasan Terkini</span>
            <div className="space-y-1.5">
              {recentEvents.length === 0 ? (
                <div className="p-3 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-400 dark:text-zinc-500">
                  Belum ada aktivitas penugasan tercatat untuk filter ini.
                </div>
              ) : (
                recentEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-black hover:bg-slate-50 dark:hover:bg-zinc-900 flex items-center justify-between gap-3 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          evt.taskCategory === 'Tugas Support' ? 'bg-[#00A2E9]' : 'bg-[#005596]'
                        }`}
                      />
                      <span className="font-semibold text-[#1E293B] dark:text-white truncate">{evt.title}</span>
                      <span className="text-[10px] text-[#64748B] dark:text-zinc-400 hidden sm:inline shrink-0">
                        • {evt.date} ({evt.time || '17:00 - 21:00'})
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        evt.taskCategory === 'Tugas Support'
                          ? 'bg-[#00A2E9]/10 text-[#00A2E9] dark:text-[#38BDF8]'
                          : 'bg-[#005596]/10 text-[#005596] dark:text-white'
                      }`}
                    >
                      {evt.taskCategory || 'Tugas Pokok'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 4-Axis Task Distribution Diagram */}
        <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-[#F4F7FA]/40 dark:bg-[#050505]">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-[#005596] dark:text-white">
                Diagram Distribusi Tugas
              </h4>
              <span className="text-[10px] font-semibold text-[#64748B] dark:text-zinc-400">
                Keseimbangan SOP
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] dark:text-zinc-400 mt-1.5">
              Proporsi keseimbangan 4 sumbu: Tupoksi vs Perbantuan & Hari Kerja vs Akhir Pekan.
            </p>
          </div>

          {/* SVG 4-Axis Coordinate System */}
          <div className="py-2 flex items-center justify-center">
            <svg
              viewBox="0 0 260 220"
              className="w-full max-w-[270px] h-auto overflow-visible select-none"
            >
              {/* Background Reference Circle Rings */}
              <circle cx={cx} cy={cy} r={maxR * 0.33} fill="none" stroke="#E2E8F0" className="dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx={cx} cy={cy} r={maxR * 0.66} fill="none" stroke="#E2E8F0" className="dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx={cx} cy={cy} r={maxR} fill="none" stroke="#E2E8F0" className="dark:stroke-zinc-800" strokeWidth="1" />

              {/* Coordinate Axes */}
              <line x1={cx - maxR - 10} y1={cy} x2={cx + maxR + 10} y2={cy} stroke="#94A3B8" className="dark:stroke-zinc-700" strokeWidth="1.5" />
              <line x1={cx} y1={cy - maxR - 10} x2={cx} y2={cy + maxR + 10} stroke="#94A3B8" className="dark:stroke-zinc-700" strokeWidth="1.5" />

              {/* Radar Polygon Shape */}
              <polygon
                points={polygonPoints}
                fill="#00A2E9"
                fillOpacity={hasData ? 0.25 : 0.08}
                stroke="#005596"
                strokeWidth="2.5"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />

              {/* Data Dots on Axis */}
              <circle cx={topPoint.x} cy={topPoint.y} r="4.5" fill="#005596" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx={bottomPoint.x} cy={bottomPoint.y} r="4.5" fill="#00A2E9" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx={leftPoint.x} cy={leftPoint.y} r="4.5" fill="#005596" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx={rightPoint.x} cy={rightPoint.y} r="4.5" fill="#FFD100" stroke="#1E293B" strokeWidth="1.5" />

              {/* Center Origin Dot */}
              <circle cx={cx} cy={cy} r="3" fill="#64748B" />

              {/* Axis Labels & Values */}
              {/* Top Axis: Tugas Pokok */}
              <text x={cx} y={cy - maxR - 14} textAnchor="middle" className="text-[10px] font-bold fill-[#005596] dark:fill-white">
                Tugas Pokok ({stats.pokokPct}%)
              </text>

              {/* Bottom Axis: Tugas Support */}
              <text x={cx} y={cy + maxR + 20} textAnchor="middle" className="text-[10px] font-bold fill-[#00A2E9] dark:fill-[#38BDF8]">
                Tugas Support ({stats.supportPct}%)
              </text>

              {/* Left Axis: Hari Kerja */}
              <text x={cx - maxR - 14} y={cy - 4} textAnchor="end" className="text-[9px] font-bold fill-[#1E293B] dark:fill-white">
                {stats.weekdayPct}%
              </text>
              <text x={cx - maxR - 14} y={cy + 8} textAnchor="end" className="text-[9px] font-medium fill-[#64748B] dark:fill-zinc-400">
                Hari Kerja
              </text>

              {/* Right Axis: Akhir Pekan */}
              <text x={cx + maxR + 14} y={cy - 4} textAnchor="start" className="text-[9px] font-bold fill-[#1E293B] dark:fill-white">
                {stats.weekendPct}%
              </text>
              <text x={cx + maxR + 14} y={cy + 8} textAnchor="start" className="text-[9px] font-medium fill-[#64748B] dark:fill-zinc-400">
                Akhir Pekan
              </text>
            </svg>
          </div>

          <div className="pt-2 border-t border-slate-200/80 dark:border-zinc-800 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-[#1E293B] dark:text-zinc-300">Status Distribusi:</span>
            <span className={`font-bold px-2 py-0.5 rounded-md border ${statusClass}`}>
              {statusText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
