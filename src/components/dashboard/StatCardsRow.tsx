'use client';

import * as React from 'react';
import { DollarSign, Users, CreditCard } from 'lucide-react';
import { FairnessMetrics } from '@/types/overtime';

interface StatCardsRowProps {
  metrics: FairnessMetrics;
  memberCount: number;
}

export function StatCardsRow({ metrics, memberCount }: StatCardsRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Jam Lembur */}
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-2xs hover:border-[#00A2E9]/50 transition-all">
        <div className="flex items-start justify-between">
          <span className="text-xs font-semibold text-[#64748B]">Total Akumulasi Lembur</span>
          <div className="size-7 rounded-lg bg-[#E0F2FE] flex items-center justify-center text-[#005596]">
            <DollarSign className="size-3.5 stroke-[2]" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#005596] tracking-tight">
          {metrics.totalDistributedHours} Jam
        </div>
        <div className="mt-2 text-[11px] font-medium text-[#64748B] flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-[#00A2E9] inline-block"></span>
          <span>{metrics.totalDistributedHours === 0 ? 'Semua personil belum ada lembur' : `${metrics.totalDistributedHours} jam terdistribusi`}</span>
        </div>
      </div>

      {/* Card 2: Selisih Jam Antar Personil */}
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-2xs hover:border-[#00A2E9]/50 transition-all">
        <div className="flex items-start justify-between">
          <span className="text-xs font-semibold text-[#64748B]">Selisih Jam Antar Personil</span>
          <div className="size-7 rounded-lg bg-[#F0F9FF] flex items-center justify-center text-[#00A2E9]">
            <Users className="size-3.5 stroke-[2]" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight">
          Δ {metrics.maxDiffHours} Jam
        </div>
        <div className="mt-2 text-[11px] font-medium text-[#005596] flex items-center gap-1">
          <span className="px-1.5 py-0.2 rounded bg-[#E0F2FE] text-[#005596] font-semibold text-[10px] border border-[#00A2E9]/30">
            {metrics.fairnessRating || 'Keadilan Sempurna'}
          </span>
          <span className="text-slate-400 font-normal">• Saldo beban seimbang</span>
        </div>
      </div>

      {/* Card 3: Total Sesi Kegiatan */}
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-2xs hover:border-[#00A2E9]/50 transition-all">
        <div className="flex items-start justify-between">
          <span className="text-xs font-semibold text-[#64748B]">Total Sesi Kegiatan / Shift</span>
          <div className="size-7 rounded-lg bg-[#E0F2FE] flex items-center justify-center text-[#00B4D8]">
            <CreditCard className="size-3.5 stroke-[2]" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#005596] tracking-tight">
          {metrics.totalEvents} Sesi
        </div>
        <div className="mt-2 text-[11px] font-medium text-[#64748B] flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-[#00B4D8] inline-block"></span>
          <span>Sesi penugasan terdistribusi di sistem</span>
        </div>
      </div>

      {/* Card 4: Total Personil Teknisi */}
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-2xs hover:border-[#00A2E9]/50 transition-all">
        <div className="flex items-start justify-between">
          <span className="text-xs font-semibold text-[#64748B]">Total Personil Teknisi</span>
          <div className="size-7 rounded-lg bg-[#FEF3C7] flex items-center justify-center text-[#B45309]">
            <Users className="size-3.5 stroke-[2]" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight">
          {memberCount} Orang
        </div>
        <div className="mt-2 text-[11px] font-semibold text-[#005596] flex items-center gap-1">
          <span className="px-1.5 py-0.2 rounded bg-[#FFD100]/25 text-[#0A2540] font-bold text-[10px] border border-[#FFD100]">
            Divisi Multimedia
          </span>
          <span className="text-slate-400 font-normal">Icon+</span>
        </div>
      </div>
    </div>
  );
}
