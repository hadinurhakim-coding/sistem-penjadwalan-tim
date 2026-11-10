'use client';

import * as React from 'react';
import {
  X,
  Calendar,
  Clock,
  UserCheck,
  Plus,
  AlertCircle,
  FileText,
  CalendarDays,
  Pencil,
  Trash2,
  Check,
  Loader2,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OvertimeEvent } from '@/types/overtime';

interface DayAgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateString: string | null;
  events: OvertimeEvent[];
  onOpenCreateSchedule: (dateString: string) => void;
  onEditSchedule?: (event: OvertimeEvent) => void;
  onDataRefreshed?: (refreshedData: any) => void;
}

export function DayAgendaModal({
  isOpen,
  onClose,
  dateString,
  events,
  onOpenCreateSchedule,
  onEditSchedule,
  onDataRefreshed,
}: DayAgendaModalProps) {
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string>('');

  if (!isOpen || !dateString) return null;

  // Filter events for this specific date
  const dayEvents = events.filter((evt) => evt.date === dateString);

  // Format date to Indonesian (e.g. "Kamis, 12 November 2026")
  const formattedDate = (() => {
    try {
      const d = new Date(dateString + 'T00:00:00');
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  })();

  const handleCreateSchedule = () => {
    onClose();
    onOpenCreateSchedule(dateString);
  };

  const handleEdit = (evt: OvertimeEvent) => {
    if (onEditSchedule) {
      onEditSchedule(evt);
    }
  };

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

      setConfirmDeleteId(null);
      if (onDataRefreshed) {
        onDataRefreshed(json.data);
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Terjadi kesalahan sistem saat menghapus.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 sm:p-7 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#E0F2FE] border border-[#00A2E9]/30 flex items-center justify-center text-[#005596] shadow-2xs">
              <CalendarDays className="size-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#005596] tracking-tight">
                Daftar Agenda Kegiatan
              </h3>
              <p className="text-xs font-semibold text-[#0A2540] mt-0.5">
                {formattedDate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Delete Error Notification */}
        {deleteError && (
          <div className="my-3 p-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>{deleteError}</span>
          </div>
        )}

        {/* Content: List of Agendas on this Date */}
        <div className="py-4">
          {dayEvents.length === 0 ? (
            /* Empty State */
            <div className="py-8 px-4 text-center rounded-xl bg-[#F4F7FA] border border-dashed border-slate-200">
              <div className="size-11 mx-auto rounded-full bg-white flex items-center justify-center text-[#00A2E9] shadow-2xs mb-2.5">
                <Calendar className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-[#005596]">
                Belum Ada Agenda pada Tanggal Ini
              </h4>
              <p className="text-xs text-[#64748B] max-w-xs mx-auto mt-1 leading-relaxed">
                Tidak ada penugasan shift atau lembur terjadwal. Klik tombol &quot;+ Buat Jadwal&quot; di bawah untuk menambahkan sesi baru.
              </p>
            </div>
          ) : (
            /* Events List */
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-xs font-semibold text-[#64748B] px-1">
                <span>Total {dayEvents.length} Agenda Terjadwal:</span>
                <span className="text-[11px] text-[#00A2E9] font-bold">PLN Icon Plus</span>
              </div>

              {dayEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-[#00A2E9]/60 transition-all border-l-4 border-l-[#00A2E9]"
                >
                  {/* Top Row: Title, Category Badge, Status, Edit & Delete Buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="text-sm font-bold text-[#0A2540] leading-snug">
                          {evt.title}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            evt.taskCategory === 'Tugas Support'
                              ? 'bg-[#00A2E9]/10 text-[#00A2E9] border border-[#00A2E9]/20'
                              : 'bg-[#005596]/10 text-[#005596] border border-[#005596]/20'
                          }`}
                        >
                          {evt.taskCategory || 'Tugas Pokok'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: Status Badge, Edit, and Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E0F2FE] text-[#005596] border border-[#00A2E9]/30">
                        {evt.status === 'Completed'
                          ? 'Selesai'
                          : evt.status === 'In Progress'
                          ? 'Sedang Berjalan'
                          : 'Sesi Terjadwal'}
                      </span>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleEdit(evt)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#005596] hover:bg-[#E0F2FE] border border-slate-200 transition-colors cursor-pointer"
                        title="Edit Tugas / Jadwal"
                      >
                        <Pencil className="size-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(evt.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer"
                        title="Hapus Tugas / Jadwal"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Delete Confirmation */}
                  {confirmDeleteId === evt.id && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-100">
                      <div className="flex items-center gap-1.5 text-red-700 font-semibold">
                        <AlertCircle className="size-3.5 shrink-0" />
                        <span>Hapus jadwal ini? Saldo teknisi akan dihitung ulang.</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={isDeleting}
                          className="px-2.5 py-1 rounded-md bg-white text-slate-600 border border-slate-200 font-semibold text-[11px] hover:bg-slate-50 cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(evt.id)}
                          disabled={isDeleting}
                          className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] shadow-2xs cursor-pointer flex items-center gap-1"
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="size-3 animate-spin" />
                              <span>Menghapus...</span>
                            </>
                          ) : (
                            'Ya, Hapus'
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Jam Operasional */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-[#005596] font-semibold">
                    <Clock className="size-3.5 text-[#00A2E9]" />
                    <span>
                      {evt.time || '17:00 - 21:00'} ({evt.durationHours || 4} Jam)
                    </span>
                  </div>

                  {/* Uraian Agenda */}
                  {evt.agenda && (
                    <div className="mt-2 text-xs text-[#1E293B] bg-[#F4F7FA] p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                      <span className="text-[11px] font-semibold text-[#64748B] block mb-0.5">
                        Uraian Tugas / Catatan:
                      </span>
                      {evt.agenda}
                    </div>
                  )}

                  {/* Lampiran Dokumen Laporan PDF (Neon Storage) */}
                  {evt.pdfFileKey && (
                    <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-[#F0F9FF] border border-[#BAE6FD] text-xs">
                      <div className="flex items-center gap-2 text-[#005596] font-semibold truncate">
                        <FileText className="size-4 shrink-0 text-[#00A2E9]" />
                        <span className="truncate">{evt.pdfFileName || 'Dokumen_Agenda.pdf'}</span>
                        {evt.pdfFileSize && (
                          <span className="text-[10px] text-slate-400 font-normal shrink-0">
                            ({Math.round(evt.pdfFileSize / 1024)} KB)
                          </span>
                        )}
                      </div>
                      <a
                        href={`/api/agenda/pdf?key=${encodeURIComponent(evt.pdfFileKey)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#005596] hover:bg-[#004275] text-white text-[11px] font-bold shadow-2xs transition-colors shrink-0"
                      >
                        <Download className="size-3" />
                        <span>Lihat PDF</span>
                      </a>
                    </div>
                  )}

                  {/* Teknisi Bertugas */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-[#64748B]">
                      Teknisi Ditugaskan:
                    </span>
                    {evt.assignedMemberNames && evt.assignedMemberNames.length > 0 ? (
                      evt.assignedMemberNames.map((name, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#005596] border border-[#00A2E9]/30 text-[11px] font-bold"
                        >
                          <UserCheck className="size-3 text-[#00A2E9]" />
                          <span>{name}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Belum ada personil
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border-slate-200 text-xs font-semibold text-[#005596] hover:bg-[#F4F7FA] cursor-pointer"
          >
            Tutup
          </Button>

          {/* Tombol Buat Jadwal (Membuka Jadwal Shift & Penugasan Tim) */}
          <Button
            type="button"
            size="sm"
            onClick={handleCreateSchedule}
            className="h-9 px-5 rounded-lg bg-[#FFD100] hover:bg-[#FACC15] text-[#0A2540] font-extrabold text-xs shadow-xs gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Buat Jadwal</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
