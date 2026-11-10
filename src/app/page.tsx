import { Suspense } from 'react';
import { connection } from 'next/server';
import { MainDashboard } from '@/components/scheduler/MainDashboard';
import { getFullOvertimeData } from '@/lib/overtime-service';

async function DashboardContainer() {
  await connection();
  const initialData = await getFullOvertimeData();
  return <MainDashboard initialData={initialData} />;
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#F8F9FA] text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="size-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span>Memuat sistem dashboard...</span>
          </div>
        </div>
      }
    >
      <DashboardContainer />
    </Suspense>
  );
}
