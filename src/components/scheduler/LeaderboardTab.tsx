'use client';

import * as React from 'react';
import { Award, Users, Scale, ArrowRight, ShieldCheck, Clock, CheckCircle } from 'lucide-react';
import { OvertimeApiResponse } from '@/types/overtime';

interface LeaderboardTabProps {
  data: OvertimeApiResponse;
  onOpenManageTeam: () => void;
  onOpenAddSchedule: () => void;
}

export function LeaderboardTab({ data, onOpenManageTeam, onOpenAddSchedule }: LeaderboardTabProps) {
  return (
    <div className="space-y-6">
      {/* Fair Ranking Recommendation Banner */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#0A0A0A] p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFD100] text-[#0A2540]">
                ⭐ Rekomendasi Prioritas Tugas
              </span>
              <span className="text-xs font-semibold text-[#005596] dark:text-[#38BDF8]">
                Rotasi Adil Berkelanjutan
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-[#005596] dark:text-white mt-1">
              Teknisi Prioritas Utama untuk Tugas Berikutnya
            </h3>
            <p className="text-xs text-[#64748B] dark:text-zinc-400 max-w-xl mt-0.5">
              Ditentukan secara objektif: akumulasi jam kerja terendah & tanggal terakhir bertugas paling lampau.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenManageTeam}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-black hover:bg-slate-50 dark:hover:bg-zinc-900 text-xs font-semibold text-[#005596] dark:text-zinc-200 transition-colors shadow-2xs cursor-pointer"
            >
              Kelola Tim ({data.members.length} Teknisi)
            </button>
            <button
              onClick={onOpenAddSchedule}
              className="px-4 py-2 rounded-xl bg-[#FFD100] hover:bg-[#FACC15] text-[#0A2540] text-xs font-extrabold transition-all shadow-sm cursor-pointer active:scale-95"
            >
              Tugaskan Sekarang
            </button>
          </div>
        </div>

        {/* Top 2 Candidates Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {data.topCandidates.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-[#111111] shadow-2xs flex flex-col justify-between hover:border-[#00A2E9]/60 dark:hover:border-zinc-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-gradient-to-r from-[#005596] to-[#00A2E9] text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                      #{c.rank}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0A2540] dark:text-white">{c.name}</h4>
                      <p className="text-[11px] text-[#64748B] dark:text-zinc-400">{c.role}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-extrabold text-[#005596] dark:text-[#38BDF8] font-mono">
                      {c.totalHours} Jam
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">{c.totalSessions} sesi</span>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded-lg bg-white dark:bg-black border border-slate-200/80 dark:border-zinc-800/80 text-xs text-[#1E293B] dark:text-zinc-300">
                  <span className="font-semibold text-[#005596] dark:text-[#38BDF8]">Alasan Objektif: </span>
                  <span>{c.reasoning}</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs text-[#64748B] dark:text-zinc-400">
                <span>Status: <strong className="text-[#005596] dark:text-[#38BDF8] font-bold">Prioritas Utama</strong></span>
                <span className="text-[11px] font-mono text-[#005596] dark:text-[#38BDF8] font-semibold">
                  {c.lastOvertimeDate ? `Terakhir: ${c.lastOvertimeDate}` : 'Belum Pernah'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#0A0A0A] p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-extrabold text-[#005596] dark:text-white tracking-tight">
              Tabel Rekapitulasi Jam Lembur & Antrean Tim
            </h3>
            <p className="text-xs text-[#64748B] dark:text-zinc-400 mt-0.5">
              Akumulasi jam berlaku berkelanjutan tanpa reset bulanan untuk menjaga pemerataan beban kerja.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E0F2FE] dark:bg-zinc-800 text-[#005596] dark:text-[#38BDF8] border border-[#00A2E9]/30 dark:border-zinc-700 self-start sm:self-auto">
            {data.metrics.fairnessRating} (Δ {data.metrics.maxDiffHours} Jam)
          </span>
        </div>

        <div className="overflow-x-auto mt-4 rounded-xl border border-slate-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 bg-[#F4F7FA] dark:bg-black text-[#005596] dark:text-[#38BDF8] font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Peringkat</th>
                <th className="py-3 px-4">Nama Teknisi</th>
                <th className="py-3 px-4 text-center">Total Jam</th>
                <th className="py-3 px-4 text-center">Jumlah Sesi</th>
                <th className="py-3 px-4">Terakhir Bertugas</th>
                <th className="py-3 px-4">Status Hak</th>
                <th className="py-3 px-4">Keterangan Objektif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 bg-white dark:bg-[#0A0A0A] text-[#1E293B] dark:text-zinc-200">
              {data.rankedMembers.map((m) => {
                const isTopTwo = m.rank <= 2;
                return (
                  <tr key={m.id} className={isTopTwo ? 'bg-[#F0F9FF]/40 dark:bg-zinc-900/60 font-medium' : 'hover:bg-[#F4F7FA] dark:hover:bg-zinc-900/40 transition-colors'}>
                    <td className="py-3 px-4 font-bold">
                      <span
                        className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${
                          m.rank === 1
                            ? 'bg-[#FFD100] text-[#0A2540] font-black'
                            : m.rank === 2
                            ? 'bg-[#E0F2FE] dark:bg-zinc-800 text-[#005596] dark:text-[#38BDF8] font-bold border border-[#00A2E9]/30 dark:border-zinc-700'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        {m.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0A2540] dark:text-white">
                      <div>{m.name}</div>
                      <div className="text-[10px] text-[#64748B] dark:text-zinc-400 font-normal">{m.role}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-black text-[#005596] dark:text-[#38BDF8] text-sm">
                      {m.totalHours} Jam
                    </td>
                    <td className="py-3 px-4 text-center text-[#64748B] dark:text-zinc-400">{m.totalSessions}x</td>
                    <td className="py-3 px-4 font-mono text-[#64748B] dark:text-zinc-400">
                      {m.lastOvertimeDate || 'Belum Pernah'}
                    </td>
                    <td className="py-3 px-4">
                      {isTopTwo ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E0F2FE] dark:bg-zinc-800 text-[#005596] dark:text-[#38BDF8] border border-[#00A2E9]/40 dark:border-zinc-700">
                          {m.statusLabel}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                          {m.statusLabel}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#64748B] dark:text-zinc-400 text-[11px] max-w-xs truncate">
                      {m.reasoning}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
