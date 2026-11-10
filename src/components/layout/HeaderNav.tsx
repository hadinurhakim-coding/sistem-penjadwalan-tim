'use client';

import * as React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

interface HeaderNavProps {
  activeTab: 'dashboard' | 'upcoming' | 'assigned' | 'settings';
  onTabChange: (tab: 'dashboard' | 'upcoming' | 'assigned' | 'settings') => void;
  onOpenManageTeam?: () => void;
}

export function HeaderNav({ activeTab, onTabChange, onOpenManageTeam }: HeaderNavProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const userName = session?.user?.name || 'Pengguna';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authClient.signOut();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
      // Fallback
      window.location.href = '/login';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-black transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* FONT Logo bertuliskan Penjadwalan Tim */}
          <div
            onClick={() => onTabChange('dashboard')}
            className="flex items-center cursor-pointer select-none group py-1"
          >
            <span className="text-base sm:text-lg font-black tracking-tight text-[#005596] dark:text-white font-sans flex items-center">
              Penjadwalan<span className="text-[#00A2E9] font-black ml-1.5">Tim</span>
              <span className="inline-block size-2 rounded-full bg-[#FFD100] ml-1.5 shadow-xs group-hover:scale-125 transition-transform"></span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-4 sm:gap-6 text-xs font-medium">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`transition-colors py-1 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-[#005596] dark:text-[#00A2E9] font-extrabold border-b-2 border-[#00A2E9]'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-[#005596] dark:hover:text-[#00A2E9]'
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() => onTabChange('upcoming')}
              className={`transition-colors py-1 cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'text-[#005596] dark:text-[#00A2E9] font-extrabold border-b-2 border-[#00A2E9]'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-[#005596] dark:hover:text-[#00A2E9]'
              }`}
            >
              Jadwal Shift
            </button>

            <button
              onClick={() => onTabChange('assigned')}
              className={`transition-colors py-1 cursor-pointer ${
                activeTab === 'assigned'
                  ? 'text-[#005596] dark:text-[#00A2E9] font-extrabold border-b-2 border-[#00A2E9]'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-[#005596] dark:hover:text-[#00A2E9]'
              }`}
            >
              Peringkat & Antrean
            </button>

            <button
              onClick={() => {
                if (onOpenManageTeam) onOpenManageTeam();
                else onTabChange('settings');
              }}
              className={`transition-colors py-1 cursor-pointer ${
                activeTab === 'settings'
                  ? 'text-[#005596] dark:text-[#00A2E9] font-extrabold border-b-2 border-[#00A2E9]'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-[#005596] dark:hover:text-[#00A2E9]'
              }`}
            >
              Kelola Tim
            </button>

            {/* User Profile Badge & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Avatar className="size-8 ring-2 ring-[#00A2E9]/30 shadow-xs">
                  <AvatarFallback className="bg-gradient-to-br from-[#005596] to-[#00A2E9] text-white text-xs font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-tight">
                    {userName}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-tight">
                    Multimedia
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                title="Keluar / Logout"
                className="p-1.5 ml-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
