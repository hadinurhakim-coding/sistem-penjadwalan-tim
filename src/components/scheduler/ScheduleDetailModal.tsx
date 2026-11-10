'use client';

import * as React from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  FileText,
  Briefcase,
  Layers,
  Pencil,
  Trash2,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock4,
  RefreshCw,
  Ban,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { OvertimeEvent, EventStatus } from '@/types/overtime';
import { getEffectiveEventStatus, generateWAGBroadcastText, copyTextToClipboard } from '@/lib/schedule-utils';

interface ScheduleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: OvertimeEvent | null;
  onEditSchedule?: (event: OvertimeEvent) => void;
  onDeleteSchedule?: (event: OvertimeEvent) => void;
  onDataRefreshed?: (refreshedData: any) => void;
}

export function ScheduleDetailModal({
  isOpen,
  onClose,
  event,
  onEditSchedule,
  onDeleteSchedule,
  onDataRefreshed,
}: ScheduleDetailModalProps) {
  const [currentStatus, setCurrentStatus] = React.useState<EventStatus>('Terjadwal');
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [isCopied, setIsCopied] = React.useState(false);

  React.useEffect(() => {
    if (event) {
      const s = getEffectiveEventStatus(event);
      setCurrentStatus(s);
      setStatusMessage(null);
    }
  }, [event]);

  if (!isOpen || !event) return null;

  // Format Code display
  const eventCode = (() => {
    const rawNumber = event.id.replace(/\D/g, '').slice(-3) || '01';
    return `SCH-${rawNumber}`;
  })();

  // Format full date in Indonesian
  const formattedFullDate = (() => {
    try {
      const d = new Date(event.date + 'T00:00:00');
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return event.date;
    }
  })();

  // Helper status color styling
  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'Selesai':
      case 'Completed':
        return {
          label: 'Selesai',
          bg: 'bg-blue-50 dark:bg-blue-950/40',
          text: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-800/60',
          dot: 'bg-blue-500',
        };
      case 'Batal':
        return {
          label: 'Batal',
          bg: 'bg-rose-50 dark:bg-rose-950/40',
          text: 'text-rose-600 dark:text-rose-400',
          border: 'border-rose-200 dark:border-rose-800/60',
          dot: 'bg-rose-500',
        };
      case 'Berubah':
        return {
          label: 'Berubah',
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          text: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-200 dark:border-amber-800/60',
          dot: 'bg-amber-500',
        };
      case 'Terjadwal':
      case 'Upcoming Session':
      case 'In Progress':
      default:
        return {
          label: 'Active / Terjadwal',
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          text: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-200 dark:border-emerald-800/60',
          dot: 'bg-emerald-500',
        };
    }
  };

  const badge = getStatusBadge(currentStatus);

  // Quick Status Updater Handler
  const handleUpdateStatus = async (newStatus: EventStatus) => {
    if (newStatus === currentStatus || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/overtime', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: event.id,
          status: newStatus,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memperbarui status agenda.');
      }

      setCurrentStatus(newStatus);
      setStatusMessage(`Status berhasil diubah menjadi "${newStatus}"`);
      if (onDataRefreshed) {
        onDataRefreshed(json.data);
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Gagal mengubah status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#0E0E0E] shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800 bg-[#F8FAFC]/80 dark:bg-zinc-900/50">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-extrabold text-xs px-2.5 py-0.5 rounded-md bg-[#0A2540] text-white">
                {eventCode}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.bg} ${badge.text} border ${badge.border}`}
              >
                <span className={`size-1.5 rounded-full ${badge.dot}`} />
                <span>{badge.label}</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700">
                {event.taskCategory || 'Tugas Pokok'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#0A2540] dark:text-white leading-snug">
              {event.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Tutup Detail"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 text-xs text-slate-700 dark:text-zinc-300">
          
          {/* Quick Status Bar */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-black/40">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-600 dark:text-zinc-300 flex items-center gap-1.5">
                <RefreshCw className={`size-3.5 ${isUpdatingStatus ? 'animate-spin text-[#00A2E9]' : 'text-slate-400'}`} />
                <span>Ubah Status Cepat:</span>
              </span>
              {statusMessage && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {statusMessage}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Terjadwal */}
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleUpdateStatus('Terjadwal')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  currentStatus === 'Terjadwal' || currentStatus === 'Upcoming Session'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-emerald-400'
                }`}
              >
                <CheckCircle2 className="size-3.5" />
                <span>Terjadwal</span>
              </button>

              {/* Selesai */}
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleUpdateStatus('Selesai')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  currentStatus === 'Selesai' || currentStatus === 'Completed'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-blue-400'
                }`}
              >
                <Clock4 className="size-3.5" />
                <span>Selesai</span>
              </button>

              {/* Berubah */}
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleUpdateStatus('Berubah')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  currentStatus === 'Berubah'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-amber-400'
                }`}
              >
                <AlertCircle className="size-3.5" />
                <span>Berubah</span>
              </button>

              {/* Batal */}
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleUpdateStatus('Batal')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  currentStatus === 'Batal'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-rose-400'
                }`}
              >
                <Ban className="size-3.5" />
                <span>Batal</span>
              </button>
            </div>
          </div>

          {/* Grid Informasi Utama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Tanggal */}
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-900/40">
              <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 mb-1">
                <Calendar className="size-4 text-[#00A2E9]" />
                <span className="font-semibold text-[11px]">Tanggal Pelaksanaan</span>
              </div>
              <p className="font-bold text-slate-800 dark:text-zinc-100 text-xs pl-6">
                {formattedFullDate}
              </p>
            </div>

            {/* Waktu & Durasi */}
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-900/40">
              <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 mb-1">
                <Clock className="size-4 text-[#00A2E9]" />
                <span className="font-semibold text-[11px]">Waktu & Durasi</span>
              </div>
              <p className="font-bold text-slate-800 dark:text-zinc-100 text-xs pl-6">
                {event.time || `${event.startTime || '17:00'} - ${event.endTime || '21:00'}`}{' '}
                <span className="text-[#005596] dark:text-[#38BDF8] font-semibold">
                  ({event.durationHours || 4} Jam)
                </span>
              </p>
            </div>

            {/* Ruangan / Lokasi */}
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-900/40">
              <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 mb-1">
                <MapPin className="size-4 text-[#00A2E9]" />
                <span className="font-semibold text-[11px]">Ruangan / Lokasi Kegiatan</span>
              </div>
              <p className="font-bold text-slate-800 dark:text-zinc-100 text-xs pl-6">
                {event.room ? (
                  <span className="inline-flex items-center gap-1.5 text-[#005596] dark:text-[#38BDF8]">
                    <span>{event.room}</span>
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Belum ditentukan</span>
                )}
              </p>
            </div>

            {/* Jenis Tugas */}
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-900/40">
              <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 mb-1">
                <Briefcase className="size-4 text-[#00A2E9]" />
                <span className="font-semibold text-[11px]">Jenis Tugas / Kategori</span>
              </div>
              <p className="font-bold text-slate-800 dark:text-zinc-100 text-xs pl-6">
                {event.taskType || event.title}
              </p>
            </div>
          </div>

          {/* Teknisi Ditugaskan */}
          <div>
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-2 flex items-center gap-2">
              <UserCheck className="size-4 text-[#00A2E9]" />
              <span>Teknisi yang Ditugaskan ({event.assignedMemberNames?.length || 0} Personil)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {event.assignedMemberNames && event.assignedMemberNames.length > 0 ? (
                event.assignedMemberNames.map((name, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2.5 shadow-2xs"
                  >
                    <div className="size-7 rounded-lg bg-[#E0F2FE] dark:bg-zinc-800 text-[#005596] dark:text-[#38BDF8] flex items-center justify-center font-bold text-xs">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white leading-tight">
                        {name}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                        Engineer Multimedia PLN Icon Plus
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-3 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-center text-slate-400 italic">
                  Belum ada teknisi yang ditugaskan pada agenda ini.
                </div>
              )}
            </div>
          </div>

          {/* Pembagian Peran Teknisi Multimedia (Jika Tersedia) */}
          {event.technicianRoles && Object.values(event.technicianRoles).some(Boolean) && (
            <div>
              <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-2 flex items-center gap-2">
                <span className="text-sm">🎭</span>
                <span>Pembagian Peran Teknisi Multimedia</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {event.technicianRoles.vjUtama && (
                  <div className="p-2.5 rounded-xl border border-blue-100 dark:border-zinc-800 bg-[#E0F2FE]/40 dark:bg-zinc-900/60 flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-600 dark:text-zinc-300 flex items-center gap-1.5">
                      <span>🎧</span>
                      <span>VJ Utama:</span>
                    </span>
                    <span className="font-bold text-xs text-[#005596] dark:text-[#38BDF8]">
                      {event.technicianRoles.vjUtama}
                    </span>
                  </div>
                )}
                {event.technicianRoles.coVjZoom && (
                  <div className="p-2.5 rounded-xl border border-blue-100 dark:border-zinc-800 bg-[#E0F2FE]/40 dark:bg-zinc-900/60 flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-600 dark:text-zinc-300 flex items-center gap-1.5">
                      <span>💻</span>
                      <span>Co-VJ / Host Zoom:</span>
                    </span>
                    <span className="font-bold text-xs text-[#005596] dark:text-[#38BDF8]">
                      {event.technicianRoles.coVjZoom}
                    </span>
                  </div>
                )}
                {event.technicianRoles.kameramen && (
                  <div className="p-2.5 rounded-xl border border-blue-100 dark:border-zinc-800 bg-[#E0F2FE]/40 dark:bg-zinc-900/60 flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-600 dark:text-zinc-300 flex items-center gap-1.5">
                      <span>🎥</span>
                      <span>Kameramen:</span>
                    </span>
                    <span className="font-bold text-xs text-[#005596] dark:text-[#38BDF8]">
                      {event.technicianRoles.kameramen}
                    </span>
                  </div>
                )}
                {event.technicianRoles.switcherPtz && (
                  <div className="p-2.5 rounded-xl border border-blue-100 dark:border-zinc-800 bg-[#E0F2FE]/40 dark:bg-zinc-900/60 flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-600 dark:text-zinc-300 flex items-center gap-1.5">
                      <span>🎛️</span>
                      <span>Switcher / Pilot PTZ:</span>
                    </span>
                    <span className="font-bold text-xs text-[#005596] dark:text-[#38BDF8]">
                      {event.technicianRoles.switcherPtz}
                    </span>
                  </div>
                )}
                {event.technicianRoles.operatorPresentasi && (
                  <div className="p-2.5 rounded-xl border border-blue-100 dark:border-zinc-800 bg-[#E0F2FE]/40 dark:bg-zinc-900/60 flex items-center justify-between sm:col-span-2">
                    <span className="font-semibold text-xs text-slate-600 dark:text-zinc-300 flex items-center gap-1.5">
                      <span>📽️</span>
                      <span>Operator Presentasi / Asrtot:</span>
                    </span>
                    <span className="font-bold text-xs text-[#005596] dark:text-[#38BDF8]">
                      {event.technicianRoles.operatorPresentasi}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Uraian Tugas / Agenda Teknis */}
          <div>
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1.5 flex items-center gap-2">
              <Layers className="size-4 text-[#00A2E9]" />
              <span>Uraian Tugas & Agenda Teknis</span>
            </h4>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 leading-relaxed text-slate-700 dark:text-zinc-300 whitespace-pre-wrap">
              {event.agenda || event.notes || 'Tidak ada uraian agenda teknis khusus yang dicatat.'}
            </div>
          </div>

          {/* Lampiran Dokumen PDF Agenda */}
          <div>
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1.5 flex items-center gap-2">
              <FileText className="size-4 text-[#00A2E9]" />
              <span>Lampiran Dokumen PDF Agenda</span>
            </h4>
            {event.pdfFileKey ? (
              <div className="p-3.5 rounded-xl border border-[#00A2E9]/30 bg-[#E0F2FE]/40 dark:bg-zinc-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
                    <FileText className="size-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-800 dark:text-white truncate">
                      {event.pdfFileName || 'Dokumen_Agenda.pdf'}
                    </p>
                    {event.pdfFileSize && (
                      <p className="text-[10px] text-slate-400">
                        {(event.pdfFileSize / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/api/agenda/pdf?key=${encodeURIComponent(event.pdfFileKey)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#005596] hover:bg-[#004077] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>Buka PDF</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-slate-400 italic text-center">
                Tidak ada dokumen PDF terlampir untuk agenda ini.
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800 bg-[#F8FAFC]/50 dark:bg-zinc-900/30 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {onDeleteSchedule && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteSchedule(event);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>Hapus Agenda</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Salin Format WAG Lembur */}
            <button
              type="button"
              onClick={async () => {
                const text = generateWAGBroadcastText(event);
                const ok = await copyTextToClipboard(text);
                if (ok) {
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isCopied
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300'
                  : 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/40'
              }`}
              title="Salin template pengumuman WhatsApp Group Lembur"
            >
              {isCopied ? (
                <>
                  <Check className="size-3.5 text-emerald-600" />
                  <span>Format WAG Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-emerald-600" />
                  <span>Salin Format WAG</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-black text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            {onEditSchedule && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditSchedule(event);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00A2E9] hover:bg-[#008CC9] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Pencil className="size-3.5" />
                <span>Edit Agenda</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
