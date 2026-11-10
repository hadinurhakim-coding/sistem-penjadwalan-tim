'use client';

import * as React from 'react';

export function DashboardSubheader() {
  const [currentDate, setCurrentDate] = React.useState('9 Nov 2026');

  React.useEffect(() => {
    const now = new Date();
    setCurrentDate(
      now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    );
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 pb-1">
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#005596]">
          Dashboard Penjadwalan
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5 font-medium">
          Selamat Datang 👋
        </p>
      </div>

      <div className="text-xs text-[#64748B] sm:text-right font-medium">
        <span>{currentDate}</span>
        <span className="mx-1.5 text-[#00A2E9] font-bold">•</span>
        <span className="font-semibold text-[#005596]">PLN Icon Plus</span>
        <span className="text-slate-400"> - Divisi Multimedia</span>
      </div>
    </div>
  );
}
