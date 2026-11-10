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
import { Member } from '@/types/overtime';
import { Users, UserPlus, Edit2, Trash2, Check, AlertCircle, Save } from 'lucide-react';

interface ManageTeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onTeamUpdated: (refreshedData: any) => void;
}

export function ManageTeamDialog({
  isOpen,
  onClose,
  members,
  onTeamUpdated,
}: ManageTeamDialogProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editRole, setEditRole] = React.useState('');

  const [newName, setNewName] = React.useState('');
  const [newRole, setNewRole] = React.useState('Tim Teknis');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleStartEdit = (member: Member) => {
    setEditingId(member.id);
    setEditName(member.name);
    setEditRole(member.role);
    setError('');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      setError('Nama personil tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/overtime/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName, role: editRole }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengubah data');
      }

      onTeamUpdated(json.data);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui nama personil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setError('Nama anggota tim baru wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/overtime/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, role: newRole }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menambahkan anggota');
      }

      onTeamUpdated(json.data);
      setNewName('');
      setNewRole('Tim Teknis');
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan personil baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Hapus ${name} dari daftar tim? Data jam yang bersangkutan akan terhapus.`)) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/overtime/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghapus anggota');
      }

      onTeamUpdated(json.data);
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus personil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#005596]">
              <Users className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-[#005596]">Kelola Anggota Tim</DialogTitle>
              <DialogDescription className="text-xs text-[#64748B]">
                Ubah nama personil asli atau tambahkan anggota baru secara dinamis ke dalam tim.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* Member List */}
          <div className="space-y-2">
            <label className="font-semibold text-foreground">
              Daftar Personil Tim ({members.length} Orang):
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border bg-card"
                >
                  {editingId === member.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nama"
                        className="h-7 text-xs flex-1"
                        autoFocus
                      />
                      <Input
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        placeholder="Peran"
                        className="h-7 text-xs w-28"
                      />
                      <Button
                        size="icon"
                        className="size-7"
                        onClick={() => handleSaveEdit(member.id)}
                        disabled={isSubmitting}
                      >
                        <Check className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{member.name}</span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1">
                          {member.role}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Akumulasi: {member.totalHours} Jam ({member.totalSessions} sesi)
                      </span>
                    </div>
                  )}

                  {editingId !== member.id && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        onClick={() => handleStartEdit(member)}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteMember(member.id, member.name)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form to add a new member */}
          <form onSubmit={handleAddMember} className="border-t pt-3 space-y-2">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <UserPlus className="size-3.5 text-primary" />
              <span>Tambah Anggota Baru ke Tim</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              <Input
                type="text"
                placeholder="Nama Lengkap"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3 h-8 text-xs"
                required
              />
              <Input
                type="text"
                placeholder="Role / Divisi"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="col-span-2 h-8 text-xs"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="w-full gap-1.5 h-8 text-xs mt-1 bg-[#005596] hover:bg-[#004275] text-white font-semibold cursor-pointer shadow-xs"
              disabled={isSubmitting}
            >
              <UserPlus className="size-3.5" />
              <span>{isSubmitting ? 'Menambahkan...' : 'Simpan Personil Baru'}</span>
            </Button>
          </form>
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
