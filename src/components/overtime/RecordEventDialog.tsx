'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RankedMember } from '@/types/overtime';
import { Calendar, UserCheck, AlertCircle, ArrowRightLeft, Clock, ShieldAlert } from 'lucide-react';

interface RecordEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rankedMembers: RankedMember[];
  onEventCreated: (refreshedData: any) => void;
}

export function RecordEventDialog({
  isOpen,
  onClose,
  rankedMembers,
  onEventCreated,
}: RecordEventDialogProps) {
  const [title, setTitle] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  // Selected members (default to top 2 candidates)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [passedIds, setPassedIds] = React.useState<string[]>([]);

  // Initialize selected to top 2 ranked members when opened
  React.useEffect(() => {
    if (isOpen && rankedMembers.length > 0) {
      const topTwo = rankedMembers.slice(0, 2).map((m) => m.id);
      setSelectedIds(topTwo);
      setPassedIds([]);
      setError('');
      setTitle('Pemeliharaan Jaringan / Layanan TI Weekday');
    }
  }, [isOpen, rankedMembers]);

  const handleToggleMember = (id: string) => {
    setError('');
    if (selectedIds.includes(id)) {
      // Removing member
      setSelectedIds(selectedIds.filter((item) => item !== id));
      // Mark as passed if they were a top candidate
      if (rankedMembers.slice(0, 2).some((m) => m.id === id) && !passedIds.includes(id)) {
        setPassedIds([...passedIds, id]);
      }
    } else {
      // Adding member (flexible count according to task needs)
      setSelectedIds([...selectedIds, id]);
      setPassedIds(passedIds.filter((item) => item !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Nama/kegiatan event lembur wajib diisi.');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Pilih minimal 1 personil (maksimal 2 personil).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/overtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          date,
          assignedMemberIds: selectedIds,
          passMemberIds: passedIds,
          notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mencatat event lembur');
      }

      onEventCreated(json.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Catat Event Lembur Weekday</DialogTitle>
              <DialogDescription className="text-xs">
                Sistem otomatis merekomendasikan 2 personil dengan prioritas tertinggi (4 jam tetap).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Event Title & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-foreground">Nama Kegiatan / Event *</label>
              <Input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="misal: Maintenance Core Switch Gandul"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Tanggal *</label>
              <Input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Fixed Duration Info */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-3.5 text-primary" />
              <span>Durasi Lembur Terkunci (Aturan Weekday):</span>
            </div>
            <Badge variant="secondary" className="font-mono font-bold">
              4 Jam Penuh / Orang
            </Badge>
          </div>

          {/* Member Selection Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground">
                Pilih Personil yang Bertugas ({selectedIds.length}/2 Dipilih):
              </label>
              <span className="text-[11px] text-muted-foreground">
                Klik untuk memilih / mengganti
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {rankedMembers.map((member) => {
                const isSelected = selectedIds.includes(member.id);
                const isTopTwo = member.rank <= 2;

                return (
                  <div
                    key={member.id}
                    onClick={() => handleToggleMember(member.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`size-4 rounded-full border flex items-center justify-center text-[10px] ${
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground font-bold'
                            : 'border-muted-foreground/40'
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{member.name}</span>
                          <Badge
                            variant={isTopTwo ? 'default' : 'outline'}
                            className="text-[10px] py-0 px-1.5"
                          >
                            Peringkat #{member.rank}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Total: <strong>{member.totalHours} Jam</strong> ({member.totalSessions} sesi)
                          {member.lastOvertimeDate
                            ? ` • Terakhir: ${member.lastOvertimeDate}`
                            : ' • Belum pernah lembur'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {isTopTwo && !isSelected && (
                        <span className="text-[10px] text-amber-500 font-medium">
                          Izin / Dilewati
                        </span>
                      )}
                      {!isTopTwo && isSelected && (
                        <span className="text-[10px] text-primary font-medium">
                          Substitusi Cadangan
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Substitution explanation note */}
          {passedIds.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-600 dark:text-amber-400">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldAlert className="size-3.5" />
                <span>Aturan Penanganan Berhalangan (Pass Substitution):</span>
              </div>
              <p className="mt-1">
                Personil yang dilewati/berhalangan tidak akan bertambah jam lemburnya, sehingga secara matematis tetap berada di peringkat teratas untuk event berikutnya.
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Catatan Tambahan (Opsional)</label>
            <Input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="misal: Shift cadangan karena personil A dinas luar kota"
              className="h-8 text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5">
              <UserCheck className="size-3.5" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Konfirmasi & Tambah Jam'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
