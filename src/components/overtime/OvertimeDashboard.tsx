'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  Scale,
  Plus,
  RefreshCw,
  Award,
  History,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { OvertimeApiResponse, RankedMember } from '@/types/overtime';
import { RecordEventDialog } from '@/components/overtime/RecordEventDialog';
import { ManageTeamDialog } from '@/components/overtime/ManageTeamDialog';

interface OvertimeDashboardProps {
  initialData: OvertimeApiResponse;
}

export function OvertimeDashboard({ initialData }: OvertimeDashboardProps) {
  const [data, setData] = React.useState<OvertimeApiResponse>(initialData);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = React.useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = React.useState(false);

  const fetchLatestData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/overtime');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to refresh overtime data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold border-amber-600">
          Rank #1 (Prioritas Tertinggi)
        </Badge>
      );
    }
    if (rank === 2) {
      return (
        <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold border-blue-700">
          Rank #2 (Kandidat Utama)
        </Badge>
      );
    }
    if (rank === 3) {
      return (
        <Badge variant="outline" className="border-cyan-500/50 text-cyan-500">
          Cadangan 1
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Cadangan 2
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Sistem Penjadwalan Lembur Adil
            </h1>
            <Badge variant="secondary" className="text-xs font-semibold">
              Perpetual Rolling Fairness
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Penentuan hak lembur otomatis tanpa reset bulanan • Rotasi adil proporsional per jenis penugasan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLatestData}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sinkron Data</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsManageModalOpen(true)}
            className="gap-2"
          >
            <Users className="size-3.5 text-primary" />
            <span>Kelola Anggota ({data.members.length})</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsRecordModalOpen(true)}
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm"
          >
            <Plus className="size-4" />
            <span>+ Catat Event Lembur</span>
          </Button>
        </div>
      </div>

      {/* Fairness & Real-Time KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Fairness Meter */}
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Index Keadilan Tim
            </CardTitle>
            <Scale className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight">
              Δ {data.metrics.maxDiffHours} Jam
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${data.metrics.fairnessColor}`}
              >
                {data.metrics.fairnessRating}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Distributed Hours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Jam Lembur
            </CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {data.metrics.totalDistributedHours} Jam
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Akumulasi kumulatif sepanjang masa
            </p>
          </CardContent>
        </Card>

        {/* Total Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Sesi Terlaksana
            </CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {data.metrics.totalEvents} Sesi
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              4 jam tetap per orang setiap sesi
            </p>
          </CardContent>
        </Card>

        {/* Active Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Jumlah Personil Tim
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {data.members.length} Orang
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dapat ditambahkan dinamis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Primary Highlight Banner: "Siapa yang Berhak Lembur Berikutnya?" */}
      <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-card to-background shadow-md">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-amber-500" />
              <div>
                <CardTitle className="text-base font-bold">
                  Rekomendasi Hak Lembur Berikutnya (Event Mendatang)
                </CardTitle>
                <CardDescription className="text-xs">
                  Ditentukan otomatis berdasarkan akumulasi jam terendah dan tanggal terakhir lembur
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="w-fit text-xs border-primary text-primary font-semibold">
              Kandidat Prioritas Antrean Adil
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.topCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="relative flex flex-col justify-between p-4 rounded-xl border bg-card/80 shadow-sm transition-all hover:border-primary/50"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-foreground">
                          {candidate.name}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {candidate.role}
                        </Badge>
                      </div>
                      <div className="mt-1">{getRankBadge(candidate.rank)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-primary">
                        {candidate.totalHours} Jam
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {candidate.totalSessions} Sesi
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground rounded-lg bg-muted/40 p-2.5 border">
                    <span className="font-semibold text-foreground">Alasan Keadilan: </span>
                    <span>{candidate.reasoning}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <span>Status Hak: <strong className="text-emerald-500">Berhak Utama</strong></span>
                  <Button
                    size="xs"
                    onClick={() => setIsRecordModalOpen(true)}
                    className="gap-1 text-[11px]"
                  >
                    <span>Tugaskan</span>
                    <ArrowRight className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Perpetual Rolling Fairness Leaderboard */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Award className="size-4 text-primary" />
                <span>Peringkat Akumulasi Sepanjang Masa (Rolling Leaderboard)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Saldo lembur tidak pernah di-reset setiap bulan. Hak lembur selalu bergulir secara adil.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setIsManageModalOpen(true)}
              className="gap-1.5"
            >
              <Users className="size-3.5" />
              <span>Kelola Personil</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-xs">
                <TableHead className="w-16">Peringkat</TableHead>
                <TableHead>Nama Personil & Peran</TableHead>
                <TableHead className="text-center">Total Jam Lembur</TableHead>
                <TableHead className="text-center">Total Sesi</TableHead>
                <TableHead>Tanggal Lembur Terakhir</TableHead>
                <TableHead>Status Hak Lembur</TableHead>
                <TableHead className="text-right">Penjelasan Objektif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {data.rankedMembers.map((member) => {
                const isTopTwo = member.rank <= 2;
                return (
                  <TableRow
                    key={member.id}
                    className={isTopTwo ? 'bg-primary/[0.03] font-medium' : ''}
                  >
                    <TableCell className="font-bold">
                      <span
                        className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${
                          member.rank === 1
                            ? 'bg-amber-500 text-white font-bold'
                            : member.rank === 2
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {member.rank}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{member.name}</span>
                        <span className="text-[11px] text-muted-foreground">{member.role}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center font-bold text-sm text-primary">
                      {member.totalHours} Jam
                    </TableCell>

                    <TableCell className="text-center font-medium">
                      {member.totalSessions}x
                    </TableCell>

                    <TableCell className="font-mono text-muted-foreground">
                      {member.lastOvertimeDate || 'Belum Pernah'}
                    </TableCell>

                    <TableCell>{getRankBadge(member.rank)}</TableCell>

                    <TableCell className="text-right text-[11px] text-muted-foreground max-w-xs truncate">
                      {member.reasoning}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* History of Overtime Events */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="size-4 text-primary" />
                <span>Riwayat Penugasan Event Lembur Weekday</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Log seluruh aktivitas lembur berbayar 4 jam yang telah diselesaikan.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {data.events.length} Event Tercatat
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {data.events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="size-8 text-muted-foreground/60 mb-2" />
              <p className="text-xs font-semibold">Belum Ada Riwayat Event Lembur</p>
              <p className="text-[11px] text-muted-foreground max-w-xs mt-1">
                Gunakan tombol &quot;+ Catat Event Lembur&quot; untuk mencatat sesi lembur weekday pertama.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead className="w-32">Tanggal</TableHead>
                  <TableHead>Nama Kegiatan / Event</TableHead>
                  <TableHead className="w-28 text-center">Durasi</TableHead>
                  <TableHead>Personil yang Bertugas</TableHead>
                  <TableHead>Catatan Operasional</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {data.events.map((evt) => (
                  <TableRow key={evt.id}>
                    <TableCell className="font-mono font-medium">{evt.date}</TableCell>
                    <TableCell className="font-semibold">{evt.title}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {evt.durationHours} Jam Penuh
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {evt.assignedMemberNames.map((name, nIdx) => (
                          <Badge key={nIdx} variant="outline" className="bg-background text-xs">
                            <UserCheck className="size-3 mr-1 text-emerald-500" />
                            <span>{name}</span>
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {evt.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Modals */}
      <RecordEventDialog
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        rankedMembers={data.rankedMembers}
        onEventCreated={(refreshed) => setData(refreshed)}
      />

      <ManageTeamDialog
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        members={data.members}
        onTeamUpdated={(refreshed) => setData(refreshed)}
      />
    </div>
  );
}
