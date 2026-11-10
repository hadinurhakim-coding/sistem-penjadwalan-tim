'use client';

import * as React from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = React.useState(false);
  const [isMorphing, setIsMorphing] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Check saved preference or system preference
    const saved = localStorage.getItem('iconplus_theme') as 'light' | 'dark' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle('dark', saved === 'dark');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isMorphing) return; // Prevent spamming while animating

    setIsMorphing(true);
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('iconplus_theme', next);

    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Smoothly hold expanded state then contract gracefully back to circle
    setTimeout(() => {
      setIsMorphing(false);
    }, 1400);
  };

  if (!mounted) {
    return (
      <div className="fixed bottom-5 left-5 z-50">
        <div className="h-11 w-11 rounded-full bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-[#222222] shadow-md opacity-0 pointer-events-none" />
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className="fixed bottom-5 left-5 z-50">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
        className={`group relative flex items-center justify-center rounded-full h-11 border shadow-lg hover:shadow-xl cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          isMorphing ? 'w-40 px-4' : 'w-11 px-0'
        } ${
          isDark
            ? 'bg-[#0D0D0D] border-[#262626] text-white shadow-black/80 hover:border-[#38BDF8]/40'
            : 'bg-white border-slate-200/90 text-[#0A2540] shadow-slate-200/60 hover:border-[#00A2E9]/40'
        }`}
        title={isDark ? 'Mode Gelap Aktif (Klik untuk beralih ke Mode Terang)' : 'Mode Terang Aktif (Klik untuk beralih ke Mode Gelap)'}
      >
        {/* Animated Moon / Sun Icon with Smooth Slow Rotation */}
        <div
          className={`flex items-center justify-center shrink-0 transition-transform duration-700 ease-in-out ${
            isMorphing ? 'rotate-360 scale-110' : 'rotate-0 scale-100 group-hover:scale-110'
          }`}
        >
          {isDark ? (
            <Moon className="size-5 text-[#38BDF8] fill-[#38BDF8]/20 transition-colors" />
          ) : (
            <Sun className="size-5 text-[#FFD100] stroke-[2.2] transition-colors" />
          )}
        </div>

        {/* Morphing Expanding Label Text with Gentle Slow Fade */}
        <div
          className={`overflow-hidden flex items-center whitespace-nowrap select-none transition-all duration-700 ease-in-out ${
            isMorphing ? 'max-w-28 opacity-100 ml-2.5' : 'max-w-0 opacity-0 ml-0'
          }`}
        >
          <span className="text-[11px] font-bold tracking-tight">
            {isDark ? 'Mode Gelap' : 'Mode Terang'}
          </span>
        </div>
      </button>
    </div>
  );
}
