'use client';

import * as React from 'react';
import {
  X,
  Search,
  Check,
  AlertCircle,
  ChevronDown,
  User,
  Clock,
  CalendarDays,
  FileText,
  Briefcase,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/shadcn-studio/date-picker';
import { RankedMember, TaskCategory, OvertimeEvent, TaskType } from '@/types/overtime';

const DEFAULT_TASK_TYPES: TaskType[] = [
  { id: 'tt-1', name: 'Pemeliharaan Studio Multimedia', category: 'Tugas Pokok' },
  { id: 'tt-2', name: 'Lembur GR (Gladi Resik)', category: 'Tugas Pokok' },
  { id: 'tt-3', name: 'Live Streaming BOD / RUPS', category: 'Tugas Pokok' },
  { id: 'tt-4', name: 'Support Agenda Kegiatan', category: 'Tugas Support' },
  { id: 'tt-5', name: 'Bantuan Teknis Vicon Gandul', category: 'Tugas Support' },
  { id: 'tt-6', name: 'Standby Insidental Lintas Divisi', category: 'Tugas Support' },
];

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  rankedMembers: RankedMember[];
  preselectedDate?: string;
  eventToEdit?: OvertimeEvent | null;
  onScheduleCreated: (refreshedData: any) => void;
}

export function AddScheduleModal({
  isOpen,
  onClose,
  rankedMembers,
  preselectedDate,
  eventToEdit,
  onScheduleCreated,
}: AddScheduleModalProps) {
  // 1. Task Types (Jenis Tugas) dari Database Table 'taskTypes'
  const [taskTypes, setTaskTypes] = React.useState<TaskType[]>([]);
  const [selectedTaskTypeId, setSelectedTaskTypeId] = React.useState<string | null>(null);
  const [isTaskTypeDropdownOpen, setIsTaskTypeDropdownOpen] = React.useState(false);
  const [taskTypeSearch, setTaskTypeSearch] = React.useState('');

  // Inline editing state for task type
  const [editingTaskTypeId, setEditingTaskTypeId] = React.useState<string | null>(null);
  const [editingTaskTypeName, setEditingTaskTypeName] = React.useState('');
  const [editingTaskTypeCategory, setEditingTaskTypeCategory] = React.useState<TaskCategory>('Tugas Pokok');

  // Adding new task type state
  const [isAddingNewTaskType, setIsAddingNewTaskType] = React.useState(false);
  const [newTaskTypeName, setNewTaskTypeName] = React.useState('');
  const [newTaskTypeCategory, setNewTaskTypeCategory] = React.useState<TaskCategory>('Tugas Pokok');

  // 2. Judul Acara / Kegiatan
  const [scheduleTitle, setScheduleTitle] = React.useState('');

  // Check if selected task type is GR (Gladi Resik)
  const isGRSelected = React.useMemo(() => {
    const title = (scheduleTitle || '').toLowerCase();
    return title.includes('gladi resik') || title.includes('lembur gr') || /\bgr\b/i.test(title);
  }, [scheduleTitle]);

  // 3. Tanggal
  const [shiftDate, setShiftDate] = React.useState('');

  // 4. Jam Mulai dan Selesai
  const [startTime, setStartTime] = React.useState('17:00');
  const [endTime, setEndTime] = React.useState('21:00');

  // 5. Kategori Tugas: Tugas Pokok (Tupoksi) vs Tugas Support (Perbantuan)
  const [taskCategory, setTaskCategory] = React.useState<TaskCategory>('Tugas Pokok');

  // 6. Agenda / Uraian Tugas
  const [agenda, setAgenda] = React.useState('');
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [existingPdf, setExistingPdf] = React.useState<{ fileName: string; key: string; size?: number } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 7. Assign Tim yang Ditugaskan
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [searchMemberQuery, setSearchMemberQuery] = React.useState('');
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const taskTypeDropdownRef = React.useRef<HTMLDivElement>(null);

  // Fetch task types from Database table '/api/task-types'
  const fetchTaskTypes = async () => {
    try {
      const res = await fetch('/api/task-types');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTaskTypes(json.data);
      }
    } catch (e) {
      console.error('Error fetching task types:', e);
    }
  };

  React.useEffect(() => {
    fetchTaskTypes();
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      fetchTaskTypes();
      setIsTaskTypeDropdownOpen(false);
      setEditingTaskTypeId(null);
      setIsAddingNewTaskType(false);
      setTaskTypeSearch('');

      if (eventToEdit) {
        setScheduleTitle(eventToEdit.title);
        setShiftDate(eventToEdit.date);
        const start = eventToEdit.startTime || (eventToEdit.time ? eventToEdit.time.split(' - ')[0] : '17:00');
        const end = eventToEdit.endTime || (eventToEdit.time && eventToEdit.time.includes(' - ') ? eventToEdit.time.split(' - ')[1].split(' ')[0] : '21:00');
        setStartTime(start);
        setEndTime(end);
        setTaskCategory(eventToEdit.taskCategory || 'Tugas Pokok');
        setAgenda(eventToEdit.agenda || eventToEdit.notes || '');
        if (eventToEdit.pdfFileName && eventToEdit.pdfFileKey) {
          setExistingPdf({
            fileName: eventToEdit.pdfFileName,
            key: eventToEdit.pdfFileKey,
            size: eventToEdit.pdfFileSize,
          });
        } else {
          setExistingPdf(null);
        }
        setPdfFile(null);
        setSelectedMemberIds(eventToEdit.assignedMemberIds || []);
        setError('');
        setIsDropdownOpen(false);

        // Find matching task type
        const match = taskTypes.find((t) => t.name.toLowerCase() === eventToEdit.title.toLowerCase());
        if (match) setSelectedTaskTypeId(match.id);
        else setSelectedTaskTypeId(null);
      } else {
        setScheduleTitle('');
        setShiftDate(preselectedDate || new Date().toISOString().split('T')[0]);
        setStartTime('17:00');
        setEndTime('21:00');
        setTaskCategory('Tugas Pokok');
        setAgenda('Maintenance & Standby Operasional Studio Multimedia');
        setExistingPdf(null);
        setPdfFile(null);
        setSelectedTaskTypeId(null);
        setSelectedMemberIds([]);
        setError('');
        setIsDropdownOpen(false);

        // Pre-select top candidate according to rolling fairness
        if (rankedMembers.length >= 2) {
          setSelectedMemberIds([rankedMembers[0].id, rankedMembers[1].id]);
        } else if (rankedMembers.length === 1) {
          setSelectedMemberIds([rankedMembers[0].id]);
        } else {
          setSelectedMemberIds([]);
        }
      }
    }
  }, [isOpen, rankedMembers, preselectedDate, eventToEdit]);

  // Close dropdowns on outside click
  // Auto-scroll dropdown teknisi ke dalam pandangan saat dibuka agar tidak terpotong
  React.useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      const timer = setTimeout(() => {
        dropdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isDropdownOpen]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (taskTypeDropdownRef.current && !taskTypeDropdownRef.current.contains(event.target as Node)) {
        setIsTaskTypeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Selected task object
  const selectedTask = taskTypes.find((t) => t.id === selectedTaskTypeId);

  // Filter task types based on search
  const filteredTaskTypes = taskTypes.filter((t) =>
    t.name.toLowerCase().includes(taskTypeSearch.toLowerCase())
  );

  // Select task type (Gambar 1 flow)
  const handleSelectTaskType = (item: TaskType) => {
    setSelectedTaskTypeId(item.id);
    setScheduleTitle(item.name);
    setTaskCategory(item.category);
    setIsTaskTypeDropdownOpen(false);
  };

  // Clear task type selection (Gambar 1 clear button)
  const handleClearTaskType = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskTypeId(null);
    setScheduleTitle('');
  };

  // Save edited task type to Database table
  const handleSaveEditedTaskType = async (id: string) => {
    if (!editingTaskTypeName.trim()) return;
    try {
      const res = await fetch('/api/task-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: editingTaskTypeName.trim(),
          category: editingTaskTypeCategory,
        }),
      });
      const json = await res.json();
      if (json.success && json.taskTypes) {
        setTaskTypes(json.taskTypes);
        setEditingTaskTypeId(null);
        if (selectedTaskTypeId === id) {
          setScheduleTitle(editingTaskTypeName.trim());
          setTaskCategory(editingTaskTypeCategory);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add new task type to Database table
  const handleAddNewTaskTypeToDB = async () => {
    if (!newTaskTypeName.trim()) return;
    try {
      const res = await fetch('/api/task-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTaskTypeName.trim(),
          category: newTaskTypeCategory,
        }),
      });
      const json = await res.json();
      if (json.success && json.taskTypes) {
        setTaskTypes(json.taskTypes);
        if (json.data) {
          setSelectedTaskTypeId(json.data.id);
          setScheduleTitle(json.data.name);
          setTaskCategory(json.data.category);
        }
        setNewTaskTypeName('');
        setIsAddingNewTaskType(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete task type from Database table
  const handleDeleteTaskTypeFromDB = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/task-types?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success && json.taskTypes) {
        setTaskTypes(json.taskTypes);
        if (selectedTaskTypeId === id) {
          setSelectedTaskTypeId(null);
          setScheduleTitle('');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMember = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      setSelectedMemberIds(selectedMemberIds.filter((item) => item !== id));
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  const handleRemoveTag = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedMemberIds(selectedMemberIds.filter((item) => item !== id));
  };

  const filteredMembers = rankedMembers.filter((m) => {
    const q = searchMemberQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      m.role.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTitle.trim()) {
      setError('Nama Acara / Jenis Tugas wajib diisi.');
      return;
    }
    if (!shiftDate) {
      setError('Tanggal kegiatan wajib dipilih.');
      return;
    }
    if (!startTime || !endTime) {
      setError('Jam mulai dan jam selesai wajib diisi.');
      return;
    }
    if (selectedMemberIds.length === 0) {
      setError('Pilih minimal 1 teknisi yang ditugaskan.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let uploadedPdf = existingPdf;
      if (pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);
        const upRes = await fetch('/api/agenda/upload-pdf', {
          method: 'POST',
          body: formData,
        });
        const upJson = await upRes.json();
        if (!upRes.ok || !upJson.success) {
          throw new Error(upJson.error || 'Gagal mengunggah berkas PDF agenda ke Neon Storage.');
        }
        uploadedPdf = {
          fileName: upJson.file.fileName,
          key: upJson.file.key,
          size: upJson.file.size,
        };
      }

      const method = eventToEdit ? 'PUT' : 'POST';
      const payload: any = {
        title: scheduleTitle.trim(),
        date: shiftDate,
        startTime,
        endTime,
        time: `${startTime} - ${endTime}`,
        taskCategory,
        agenda: agenda.trim(),
        notes: agenda.trim(),
        assignedMemberIds: isGRSelected ? selectedMemberIds : [],
        pdfFileName: uploadedPdf ? uploadedPdf.fileName : null,
        pdfFileKey: uploadedPdf ? uploadedPdf.key : null,
        pdfFileSize: uploadedPdf ? uploadedPdf.size : null,
        pdfUploadedAt: uploadedPdf ? new Date().toISOString() : null,
        status: eventToEdit?.status || 'Upcoming Session',
      };
      if (eventToEdit) {
        payload.id = eventToEdit.id;
      }

      const res = await fetch('/api/overtime', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyimpan jadwal');
      }

      onScheduleCreated(json.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#0A0A0A] p-5 sm:p-7 shadow-2xl border border-gray-100 dark:border-[#222222] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-[#222222]">
          <div>
            <h3 className="text-base font-extrabold text-[#005596] dark:text-[#38BDF8] tracking-tight">
              {eventToEdit ? 'Edit Jadwal & Penugasan Tim' : 'Jadwal Shift & Penugasan Tim'}
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5 font-medium">
              {eventToEdit
                ? 'Perbarui rincian kegiatan, jenis tugas, jam, atau personil yang ditugaskan.'
                : 'Atur jadwal teknis, pilih jenis tugas kerjaan, dan tentukan personil yang bertugas.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {error && (
          <div className="my-3 p-2.5 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs pb-6">
          {/* ======================================================== */}
          {/* 1. GAMBAR 1 UI: Multiselect with placeholder and clear   */}
          {/* Database Table 'taskTypes' with dynamic edit / rename     */}
          {/* ======================================================== */}
          <div className="space-y-1.5 relative" ref={taskTypeDropdownRef}>
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#1E293B] dark:text-slate-200 flex items-center gap-1.5">
                <Briefcase className="size-3.5 text-[#005596] dark:text-[#38BDF8]" />
                <span>Pilih Jenis Tugas</span>
              </label>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400">
                Tabel Database: <strong className="text-[#005596] dark:text-[#38BDF8]">taskTypes</strong>
              </span>
            </div>

            {/* Input Trigger with Placeholder and Clear Button (Gambar 1) */}
            <div
              onClick={() => setIsTaskTypeDropdownOpen(!isTaskTypeDropdownOpen)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#222222] bg-white dark:bg-black text-xs text-[#1E293B] dark:text-[#E2E8F0] flex items-center justify-between cursor-pointer hover:border-[#00A2E9] focus-within:border-[#00A2E9] shadow-2xs transition-all"
            >
              <div className="flex items-center gap-2 flex-1 truncate">
                {selectedTask ? (
                  <div className="flex items-center gap-2 truncate">
                    <span>{selectedTask.category === 'Tugas Pokok' ? '🏢' : '🤝'}</span>
                    <span className="font-bold text-[#005596] dark:text-[#38BDF8] truncate">
                      {selectedTask.name}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        selectedTask.category === 'Tugas Pokok'
                          ? 'bg-[#E0F2FE] dark:bg-[#141414] text-[#005596] dark:text-[#38BDF8]'
                          : 'bg-[#00A2E9]/10 dark:bg-cyan-900/30 text-[#00A2E9] dark:text-cyan-400'
                      }`}
                    >
                      {selectedTask.category === 'Tugas Pokok' ? 'Tupoksi' : 'Support'}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-400 select-none flex items-center gap-1">
                    <span className="text-[#00A2E9] animate-pulse">|</span> Select categories / Pilih jenis tugas...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {selectedTask && (
                  <button
                    type="button"
                    onClick={handleClearTaskType}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Kosongkan pilihan"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
                <ChevronDown
                  className={`size-4 text-slate-400 transition-transform ${
                    isTaskTypeDropdownOpen ? 'rotate-180 text-[#00A2E9]' : ''
                  }`}
                />
              </div>
            </div>

            {/* Dropdown Menu matching Gambar 1 list with hover and edit features */}
            {isTaskTypeDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-[#222222] shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-100 max-h-72 overflow-y-auto">
                {/* Search Box */}
                <div className="p-1 mb-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={taskTypeSearch}
                      onChange={(e) => setTaskTypeSearch(e.target.value)}
                      placeholder="Cari jenis tugas..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#222222] text-xs bg-slate-50 dark:bg-[#050505] text-[#1E293B] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00A2E9]"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
        
                    />
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-1">
                  {filteredTaskTypes.map((item) => {
                    const isSelected = selectedTaskTypeId === item.id;
                    const isEditingThis = editingTaskTypeId === item.id;

                    if (isEditingThis) {
                      return (
                        <div
                          key={item.id}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2.5 rounded-lg bg-[#F0F9FF] dark:bg-[#141414] border border-[#00A2E9] space-y-2 animate-in fade-in duration-100"
                        >
                          <div className="text-[11px] font-bold text-[#005596] dark:text-[#38BDF8]">
                            Edit Nama Jenis Tugas di Database:
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingTaskTypeName}
                              onChange={(e) => setEditingTaskTypeName(e.target.value)}
                              className="flex-1 px-2.5 py-1 rounded-md border border-slate-300 dark:border-[#27272A] text-xs bg-white dark:bg-black text-[#1E293B] dark:text-white focus:outline-none focus:border-[#00A2E9]"
                
                              />
                            <select
                              value={editingTaskTypeCategory}
                              onChange={(e) => setEditingTaskTypeCategory(e.target.value as TaskCategory)}
                              className="px-2 py-1 rounded-md border border-slate-300 dark:border-[#27272A] text-[11px] font-semibold bg-white dark:bg-black"
                            >
                              <option value="Tugas Pokok">🏢 Tupoksi</option>
                              <option value="Tugas Support">🤝 Support</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingTaskTypeId(null)}
                              className="px-2.5 py-1 rounded text-[11px] font-medium text-slate-500 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-[#222222] cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditedTaskType(item.id)}
                              className="px-3 py-1 rounded text-[11px] font-bold bg-[#005596] text-white hover:bg-[#004275] cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Check className="size-3" />
                              <span>Simpan</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectTaskType(item)}
                        className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#E0F2FE] dark:bg-[#202020] text-[#005596] dark:text-[#38BDF8] font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-[#1E2A4A] text-[#1E293B] dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span>{item.category === 'Tugas Pokok' ? '🏢' : '🤝'}</span>
                          <span className="text-xs truncate">{item.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                              item.category === 'Tugas Pokok'
                                ? 'bg-blue-100 text-[#005596] dark:bg-blue-900/40 dark:text-blue-300'
                                : 'bg-cyan-100 text-[#00A2E9] dark:bg-cyan-900/40 dark:text-cyan-300'
                            }`}
                          >
                            {item.category === 'Tugas Pokok' ? 'Tupoksi' : 'Support'}
                          </span>
                        </div>

                        {/* Inline Actions: Edit and Delete buttons */}
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 shrink-0">
                          {/* Edit / Rename Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTaskTypeId(item.id);
                              setEditingTaskTypeName(item.name);
                              setEditingTaskTypeCategory(item.category);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-[#005596] dark:hover:text-[#38BDF8] hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit Nama Jenis Tugas di Database"
                          >
                            <Pencil className="size-3" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTaskTypeFromDB(e, item.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Hapus dari Database"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredTaskTypes.length === 0 && (
                    <div className="py-6 px-3 text-center text-xs">
                      <p className="font-semibold text-slate-600 dark:text-zinc-300">
                        {taskTypes.length === 0
                          ? 'Belum ada item jenis tugas di database.'
                          : 'Tidak ada jenis tugas yang sesuai pencarian.'}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                        {taskTypes.length === 0
                          ? 'Semua item jenis tugas telah dihapus. Klik tombol di bawah untuk membuat item baru.'
                          : 'Coba ubah kata kunci pencarian.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Add New Task Type to Database */}
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-[#222222]">
                  {!isAddingNewTaskType ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAddingNewTaskType(true);
                      }}
                      className="w-full py-1.5 px-2 rounded-lg text-xs font-semibold text-[#00A2E9] dark:text-[#38BDF8] hover:bg-[#F0F9FF] dark:hover:bg-[#1A2D54] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      <span>+ Tambah Jenis Tugas Baru ke Database</span>
                    </button>
                  ) : (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="p-2.5 rounded-lg bg-[#F0F9FF] dark:bg-[#141414] border border-[#00A2E9]/40 space-y-2 animate-in fade-in duration-100"
                    >
                      <div className="text-[11px] font-bold text-[#005596] dark:text-[#38BDF8]">
                        Tambah Jenis Tugas Baru:
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-1.5">
                        <input
                          type="text"
                          value={newTaskTypeName}
                          onChange={(e) => setNewTaskTypeName(e.target.value)}
                          placeholder="Nama jenis tugas baru..."
                          className="w-full px-2.5 py-1 rounded-md border border-slate-300 dark:border-[#27272A] text-xs bg-white dark:bg-black text-[#1E293B] dark:text-white"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddNewTaskTypeToDB();
                            }
                          }}
            
                          />
                        <select
                          value={newTaskTypeCategory}
                          onChange={(e) => setNewTaskTypeCategory(e.target.value as TaskCategory)}
                          className="w-full sm:w-auto px-2 py-1 rounded-md border border-slate-300 dark:border-[#27272A] text-[11px] font-semibold bg-white dark:bg-black"
                        >
                          <option value="Tugas Pokok">🏢 Tupoksi</option>
                          <option value="Tugas Support">🤝 Support</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingNewTaskType(false)}
                          className="px-2.5 py-1 rounded text-[11px] font-medium text-slate-500 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-[#222222] cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleAddNewTaskTypeToDB}
                          className="px-3 py-1 rounded text-[11px] font-bold bg-[#005596] text-white hover:bg-[#004275] cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="size-3" />
                          <span>Simpan ke Database</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Detail Nama Acara / Kegiatan */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#1E293B] dark:text-slate-200">
              Nama Acara / Detail Kegiatan
            </label>
            <input
              type="text"
              required
              value={scheduleTitle}
              onChange={(e) => setScheduleTitle(e.target.value)}
              placeholder="Contoh: Pemeliharaan Studio Multimedia / Live Streaming BOD..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#222222] text-xs text-[#1E293B] dark:text-[#E2E8F0] placeholder-slate-400 focus:outline-none focus:border-[#00A2E9] focus:ring-1 focus:ring-[#00A2E9] bg-white dark:bg-black transition-colors"

            />
          </div>

          {/* 3. Klasifikasi Jenis Kerjaan: Tugas Pokok (Tupoksi) vs Tugas Support (Perbantuan) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#1E293B] dark:text-slate-200 block">
                Klasifikasi Jenis Kerjaan
              </label>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400">
                Menentukan akumulasi dot kontribusi otomatis
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F4F7FA] dark:bg-[#050505] border border-slate-200 dark:border-[#222222]">
              <button
                type="button"
                onClick={() => setTaskCategory('Tugas Pokok')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  taskCategory === 'Tugas Pokok'
                    ? 'bg-[#005596] text-white shadow-xs'
                    : 'text-[#64748B] dark:text-slate-400 hover:text-[#005596] dark:hover:text-[#38BDF8]'
                }`}
              >
                <span>🏢</span>
                <span>Tugas Pokok (Tupoksi)</span>
              </button>
              <button
                type="button"
                onClick={() => setTaskCategory('Tugas Support')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  taskCategory === 'Tugas Support'
                    ? 'bg-[#00A2E9] text-white shadow-xs'
                    : 'text-[#64748B] dark:text-slate-400 hover:text-[#005596] dark:hover:text-[#38BDF8]'
                }`}
              >
                <span>🤝</span>
                <span>Tugas Support (Perbantuan)</span>
              </button>
            </div>
          </div>

          {/* 4 & 5. Tanggal, Jam Mulai dan Jam Selesai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Tanggal with Shadcn DatePicker */}
            <div>
              <DatePicker
                id="shift-date-picker"
                label="Tanggal Kegiatan"
                date={shiftDate ? new Date(shiftDate + 'T00:00:00') : undefined}
                onDateChange={(d) => {
                  if (d) {
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    setShiftDate(`${y}-${m}-${day}`);
                  }
                }}
                placeholder="Pilih Tanggal Kegiatan"
  
              />
            </div>

            {/* Jam Mulai dan Jam Selesai */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#1E293B] dark:text-slate-200">Jam Mulai</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#222222] text-xs text-[#1E293B] dark:text-[#E2E8F0] focus:outline-none focus:border-[#00A2E9] focus:ring-1 focus:ring-[#00A2E9] bg-white dark:bg-black transition-colors"
    
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#1E293B] dark:text-slate-200">Jam Selesai</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#222222] text-xs text-[#1E293B] dark:text-[#E2E8F0] focus:outline-none focus:border-[#00A2E9] focus:ring-1 focus:ring-[#00A2E9] bg-white dark:bg-black transition-colors"
    
                />
              </div>
            </div>
          </div>

          {/* 6. Agenda / Uraian Tugas */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#1E293B] dark:text-slate-200">
              Uraian Tugas / Agenda Teknis
            </label>
            <textarea
              rows={2}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Contoh: Maintenance sistem audio-visual, standby operator video conference, uji jalur streaming..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#222222] text-xs text-[#1E293B] dark:text-[#E2E8F0] placeholder-slate-400 focus:outline-none focus:border-[#00A2E9] focus:ring-1 focus:ring-[#00A2E9] bg-white dark:bg-black resize-none transition-colors"

            />
          </div>

          {/* 6.5 Lampiran PDF Dokumen Agenda (Neon Object Storage - uploads) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#1E293B] dark:text-slate-200 flex items-center gap-1.5 text-xs">
                <FileText className="size-3.5 text-[#00A2E9]" />
                <span>Lampiran Dokumen PDF Agenda</span>
              </label>
              <span className="text-[10px] text-slate-400">Format: .pdf (Maks. 15 MB)</span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                    setError('Format berkas harus berupa dokumen PDF (.pdf)');
                    return;
                  }
                  if (file.size > 15 * 1024 * 1024) {
                    setError('Ukuran berkas PDF tidak boleh melebihi 15 MB');
                    return;
                  }
                  setPdfFile(file);
                  setExistingPdf(null);
                  setError('');
                }
              }}

            />
            {/* Display Active / Selected File */}
            {pdfFile ? (
              <div className="p-2.5 rounded-lg border border-[#00A2E9]/40 bg-[#E0F2FE]/40 dark:bg-zinc-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-7 rounded bg-[#005596] text-white flex items-center justify-center shrink-0">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#005596] dark:text-[#38BDF8] truncate">
                      {pdfFile.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {Math.round(pdfFile.size / 1024)} KB • Siap diunggah ke Neon Bucket
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPdfFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1 rounded text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  title="Batalkan pilihan berkas"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : existingPdf ? (
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-7 rounded bg-[#00A2E9] text-white flex items-center justify-center shrink-0">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                      {existingPdf.fileName}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Tersimpan di Neon Storage (uploads)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 rounded text-[11px] font-semibold text-[#005596] hover:bg-[#E0F2FE] border border-slate-200 transition-colors cursor-pointer"
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExistingPdf(null);
                      setPdfFile(null);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Hapus lampiran PDF"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800 hover:border-[#00A2E9] bg-slate-50/60 dark:bg-zinc-950 flex items-center justify-center gap-2 cursor-pointer transition-colors group"
              >
                <Upload className="size-4 text-slate-400 group-hover:text-[#00A2E9] transition-colors" />
                <span className="text-xs text-slate-500 dark:text-zinc-400 group-hover:text-[#005596] dark:group-hover:text-white transition-colors">
                  Klik untuk lampirkan berkas PDF agenda / laporan
                </span>
              </div>
            )}


          </div>

          {/* 7. Assign Tim yang Ditugaskan */}
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#1E293B] dark:text-slate-200">
                Teknisi yang Ditugaskan ({selectedMemberIds.length} Personil)
              </label>
              <span className="text-[10px] text-[#005596] dark:text-[#38BDF8] font-semibold bg-[#E0F2FE] dark:bg-[#141414] px-2 py-0.5 rounded-full border border-[#00A2E9]/30">
                ⭐ Prioritas antrean adil
              </span>
            </div>

            {/* Input Trigger with Tags */}
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="min-h-10 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222222] bg-white dark:bg-black text-xs flex flex-wrap items-center justify-between gap-1.5 cursor-pointer hover:border-[#00A2E9] transition-all shadow-2xs"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedMemberIds.length === 0 ? (
                  <span className="text-slate-400">Pilih teknisi yang bertugas (bebas sesuai kebutuhan tugas)...</span>
                ) : (
                  selectedMemberIds.map((id) => {
                    const member = rankedMembers.find((m) => m.id === id);
                    if (!member) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E0F2FE] dark:bg-[#141414] text-[#005596] dark:text-[#38BDF8] border border-[#00A2E9]/40 text-[11px] font-semibold"
                      >
                        <span>{member.name}</span>
                        <span
                          onClick={(e) => handleRemoveTag(e, id)}
                          className="hover:text-red-500 cursor-pointer text-[#005596]/70 dark:text-[#38BDF8]/70"
                        >
                          ✕
                        </span>
                      </span>
                    );
                  })
                )}
              </div>
              <ChevronDown className="size-4 text-[#00A2E9] shrink-0" />
            </div>

            {/* Dropdown Menu (In-flow accordion to prevent clipping & covering action buttons) */}
            {isDropdownOpen && (
              <div className="mt-2 rounded-xl bg-slate-50/80 dark:bg-[#080808] border border-slate-200 dark:border-[#222222] shadow-sm p-2.5 animate-in fade-in duration-100">
                {/* Search Box */}
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchMemberQuery}
                    onChange={(e) => setSearchMemberQuery(e.target.value)}
                    placeholder="Cari nama teknisi / jabatan..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#222222] text-xs placeholder-slate-400 focus:outline-none focus:border-[#00A2E9] focus:ring-1 focus:ring-[#00A2E9] bg-white dark:bg-[#050505] text-[#1E293B] dark:text-white"
                    autoFocus
                  />
                </div>

                {/* Member Checkbox List */}
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                  {filteredMembers.map((member) => {
                    const isSelected = selectedMemberIds.includes(member.id);

                    return (
                      <div
                        key={member.id}
                        onClick={() => handleToggleMember(member.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#F0F9FF] dark:bg-[#141414]'
                            : 'hover:bg-[#F4F7FA] dark:hover:bg-[#101B33]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Checkbox */}
                          <div
                            className={`size-4 rounded border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-[#00A2E9] border-[#005596] text-white font-bold'
                                : 'border-slate-300 dark:border-[#27272A] bg-white dark:bg-black'
                            }`}
                          >
                            {isSelected && <Check className="size-3 stroke-[3]" />}
                          </div>

                          {/* Member Avatar Circle */}
                          <div className="size-6 rounded-full bg-[#E0F2FE] dark:bg-[#141414] border border-[#00A2E9]/30 flex items-center justify-center text-[#005596] dark:text-[#38BDF8] text-[10px]">
                            <User className="size-3.5" />
                          </div>

                          <div>
                            <div className="font-semibold text-[#0A2540] dark:text-slate-100 text-xs flex items-center gap-1.5">
                              <span>{member.name}</span>
                              {member.rank <= 2 && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FFD100] text-[#0A2540] border border-[#FFD100]">
                                  Prioritas Adil
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#64748B] dark:text-slate-400">
                              {member.email || 'Email belum diisi'} | {member.role}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-[#005596] dark:text-[#38BDF8] font-semibold">
                          {member.totalHours} Jam
                        </span>
                      </div>
                    );
                  })}

                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-[#222222] flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-lg border-slate-200 dark:border-[#222222] text-xs font-semibold text-[#005596] dark:text-[#38BDF8] hover:bg-[#F4F7FA] dark:hover:bg-[#101B33] cursor-pointer"
            >
              Batal
            </Button>

            {/* Electric Yellow CTA Button */}
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-9 px-5 rounded-lg bg-[#FFD100] hover:bg-[#FACC15] text-[#0A2540] font-extrabold text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              {isSubmitting ? 'Menyimpan...' : eventToEdit ? 'Simpan Perubahan' : 'Simpan Jadwal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
