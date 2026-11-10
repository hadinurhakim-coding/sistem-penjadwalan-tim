'use client';

import * as React from 'react';
import { HeaderNav } from '@/components/layout/HeaderNav';
import { DashboardSubheader } from '@/components/dashboard/DashboardSubheader';
import { TeamContributionHeatmap } from '@/components/dashboard/TeamContributionHeatmap';
import { StatCardsRow } from '@/components/dashboard/StatCardsRow';
import { MonthlyCalendarView } from '@/components/scheduler/MonthlyCalendarView';
import { UpcomingListView } from '@/components/scheduler/UpcomingListView';
import { LeaderboardTab } from '@/components/scheduler/LeaderboardTab';
import { AddScheduleModal } from '@/components/scheduler/AddScheduleModal';
import { ManageTeamDialog } from '@/components/overtime/ManageTeamDialog';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { OvertimeApiResponse, OvertimeEvent } from '@/types/overtime';

interface MainDashboardProps {
  initialData: OvertimeApiResponse;
}

export function MainDashboard({ initialData }: MainDashboardProps) {
  const [data, setData] = React.useState<OvertimeApiResponse>(initialData);
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'upcoming' | 'assigned' | 'settings'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = React.useState(false);
  const [preselectedDate, setPreselectedDate] = React.useState<string | undefined>(undefined);
  const [eventToEdit, setEventToEdit] = React.useState<OvertimeEvent | null>(null);

  const handleOpenAddModal = (dateStr?: string) => {
    setEventToEdit(null);
    setPreselectedDate(dateStr);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (event: OvertimeEvent) => {
    setEventToEdit(event);
    setPreselectedDate(event.date);
    setIsAddModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['ID_Jadwal', 'Nama_Kegiatan', 'Tanggal', 'Jam_Operasional', 'Agenda_Kegiatan', 'Teknisi_Bertugas', 'Status'];
    const rows = data.events.map((e) => [
      e.id,
      `"${e.title}"`,
      e.date,
      `"${e.time || '17:00 - 21:00'}"`,
      `"${e.agenda || e.notes || '-'}"`,
      `"${e.assignedMemberNames.join(', ')}"`,
      `"${e.status === 'Completed' ? 'Selesai' : e.status === 'In Progress' ? 'Sedang Berjalan' : 'Sesi Terjadwal'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jadwal_shift_multimedia_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] dark:bg-black text-[#1E293B] dark:text-white font-sans selection:bg-[#00A2E9] selection:text-white flex flex-col transition-colors duration-300">
      {/* Top Navbar matching frame_17s.jpg */}
      <HeaderNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'settings') {
            setIsManageModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenManageTeam={() => setIsManageModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Subheader: "Dashboard" + "Welcome Back! Zunaira Naveed 👋" + "4 Aug 2025 • Allama Iqbal International Airport..." */}
        <DashboardSubheader />

        {/* Fitur Dot Kontribusi Per Akun (Tugas Pokok vs Tugas Support) */}
        <TeamContributionHeatmap
          members={data.members}
          events={data.events}
          onOpenAddSchedule={() => handleOpenAddModal()}
        />

        {/* 4 Stat Cards: Total Returnees, Mid-to Long Term, Immediate Needs, Total Number of Counsellor */}
        <StatCardsRow
          metrics={data.metrics}
          memberCount={data.members.length}
        />

        {/* Content based on Active Tab */}
        {activeTab === 'dashboard' && (
          <MonthlyCalendarView
            events={data.events}
            onOpenAddModal={handleOpenAddModal}
            onEditSchedule={handleOpenEditModal}
            onDataRefreshed={(refreshed) => setData(refreshed)}
            onExportCSV={handleExportCSV}
          />
        )}

        {activeTab === 'upcoming' && (
          <UpcomingListView
            events={data.events}
            onOpenAddSchedule={() => handleOpenAddModal()}
            onEditSchedule={handleOpenEditModal}
            onDataRefreshed={(refreshed) => setData(refreshed)}
            onExportCSV={handleExportCSV}
          />
        )}

        {activeTab === 'assigned' && (
          <LeaderboardTab
            data={data}
            onOpenManageTeam={() => setIsManageModalOpen(true)}
            onOpenAddSchedule={() => handleOpenAddModal()}
          />
        )}
      </main>

      {/* Add / Edit Schedule Modal */}
      <AddScheduleModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEventToEdit(null);
        }}
        rankedMembers={data.rankedMembers}
        preselectedDate={preselectedDate}
        eventToEdit={eventToEdit}
        onScheduleCreated={(refreshed) => {
          setData(refreshed);
          setEventToEdit(null);
        }}
      />

      {/* Dynamic Member Management Dialog */}
      <ManageTeamDialog
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        members={data.members}
        onTeamUpdated={(refreshed) => setData(refreshed)}
      />

      {/* Dark / Light Mode Toggle Button (Positioned at bottom-left as requested) */}
      <ThemeToggle />
    </div>
  );
}
