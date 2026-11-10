'use client';

import * as React from 'react';
import { DollarSign, Users, Calendar, Scale, Info } from 'lucide-react';
import { FairnessMetrics } from '@/types/overtime';

interface StatCardsRowProps {
  metrics: FairnessMetrics;
  memberCount: number;
}

export function StatCardsRow({ metrics, memberCount }: StatCardsRowProps) {
  // Helper detail penjelasan keadilan beban kerja
  const getFairnessDetail = (diff: number) => {
    if (diff === 0) {
      return {
        badge: 'Keadilan Sempurna',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
        explanation: 'Semua teknisi memiliki jam lembur yang sama persis',
      };
    }
    if (diff <= 4) {
      return {
        badge: 'Sangat Seimbang',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
        explanation: 'Beban kerja merata (hanya selisih 1 sesi shift tugas)',
      };
    }
    if (diff <= 8) {
      return {
        badge: 'Wajar',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
        explanation: 'Selisih 2 sesi shift, prioritaskan personil antrean awal',
      };
    }
    return {
      badge: 'Perlu Rotasi',
      badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
      explanation: 'Beban belum merata, wajib dahulukan teknisi jam terendah',
    };
  };

  const fairness = getFairnessDetail(metrics.maxDiffHours);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Jam Lembur */}
      <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0A0A0A] p-5 shadow-2xs hover:border-[#00A2E9]/50 transition-all">
        <div className="flex items-start justify-between">
          <span className="text-xs font-semibold text-[#64748B] dark:text-zinc-400">Total Akumulasi Lembur</span>
          <div className="size-7 rounded-lg bg-[#E0F2FE] dark:bg-zinc-800 flex items-center justify-center text-[#005596] dark:text-[#38BDF8]">
            <DollarSign className="size-3.5 stroke-[2]" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#005596] dark:text-[#38BDF8] tracking-tight">
          {metrics.totalDistributedHours} Jam
        </div>
        <div className="mt-2 text-[11px] font-medium text-[#64748B] dark:text-zinc-400 flex items-center gap-1.5 truncate">
          <span className="size-1.5 rounded-full bg-[#00A2E9] shrink-0" />
          <span className="truncate">
            {metrics.totalDistributedHours === 0
              ? 'Belum ada jam lembur terakumulasi'
              : `${metrics.totalDistributedHours} jam terdistribusi ke seluruh tim`}
          </span>
        </div>
      </div>

      {/* Card 2: Pemerataan Beban Tim (Indikator Keadilan Rotasi) */}
      <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0A0A0A] p-5 shadow-2xs hover:border-[#00A2E9]/50 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#64748B] dark:text-zinc-400">Pemerataan Beban Tim</span>
            <div className="group relative">
              <Info className="size-3.5 text-slate-400 hover:text-[#00A2E9] cursor-pointer" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-40 w-64 p-2.5 rounded-xl bg-slate-900 text-white text-[11px] leading-relaxed shadow-2xl border border-slate-700 animate-in fade-in duration-150">
                <p className="font-bold mb-1 text-[#38BDF8]">Indikator Keadilan Beban Kerja:</p>
                <p>
                  Mengukur gap (selisih) antara teknisi dengan jam terbanyak (
                  {metrics.maxHours ?? metrics.maxDiffHours}j) dan tersedikit ({metrics.minHours ?? 0}j).
                  Sistem menjaga selisih ini sekecil mungkin agar giliran tugas adil dan tidak membebani teknisi tertentu.
                </p>
              </div>
            </div>
          </div>
          <div className="size-7 rounded-lg bg-[#F0F9FF] dark:bg-zinc-800 flex items-center justify-center text-[#00A2E9] dark:text-[#38BDF8]">
            <Scale className="size-3.5 stroke-[2]" />
          </div>
        </div>

        {/* Big Number & Gap Context */}
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] dark:text-white tracking-tight">
            Δ {metrics.maxDiffHours} Jam
          </span>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
            (Gap Max vs Min)
          </span>
        </div>

        {/* Clear Explanatory Footnote */}
        <div className="mt-2 text-[11px] font-medium flex items-center gap-1.5 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border shrink-0 ${fairness.badgeClass}`}>
            {fairness.badge}
          </span>
          <span className="text-slate-500 dark:text-zinc-400 text-[10.5px] truncate" title={fairness.explanation}>
            • {fairness.explanation}
          </span>
        </div>
      </div>

      {/* Card 3: Total Sesi Kegiatan */}
      <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0A0A0A] p-5 shadow-2xs hover:border-[#00A2E9]/50 transition-all">
        <div className="flex items-start justify-between">
          <span className="text-xs font-semibold text-[#64748B] dark:text-zinc-400">Total Sesi Kegiatan / Shift</span>
          <div className="size-7 rounded-lg bg-[#E0F2FE] dark:bg-zinc-800 flex items-center justify-center text-[#00B4D8]">
            <Calendar className="size-3.5 stroke-[2]" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#005596] dark:text-[#38BDF8] tracking-tight">
          {metrics.totalEvents} Sesi
        </div>
        <div className="mt-2 text-[11px] font-medium text-[#64748B] dark:text-zinc-400 flex items-center gap-1.5 truncate">
          <span className="size-1.5 rounded-full bg-[#00B4D8] shrink-0" />
          <span className="truncate">Seluruh agenda kegiatan tersimpan di sistem</span>
        </div>
      </div>

      {/* Card 4: Total Personil Teknisi */}
      <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0A0A0A] p-5 shadow-2xs hover:border-[#00A2E9]/50 transition-all">
        <div className="flex items-start justify-between">
          <span className="text-xs font-semibold text-[#64748B] dark:text-zinc-400">Total Personil Teknisi</span>
          <div className="size-7 rounded-lg bg-[#FEF3C7] dark:bg-zinc-800 flex items-center justify-center text-[#B45309] dark:text-amber-400">
            <Users className="size-3.5 stroke-[2]" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0A2540] dark:text-white tracking-tight">
          {memberCount} Orang
        </div>
        <div className="mt-2 text-[11px] font-semibold text-[#005596] dark:text-[#38BDF8] flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-[#FFD100]/25 text-[#0A2540] dark:text-amber-300 font-extrabold text-[10px] border border-[#FFD100]">
            Divisi Multimedia
          </span>
          <span className="text-slate-400 dark:text-zinc-500 font-normal">PLN Icon Plus</span>
        </div>
      </div>
    </div>
  );
}
