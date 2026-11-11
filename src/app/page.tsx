import { Suspense } from 'react';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { MainDashboard } from '@/components/scheduler/MainDashboard';
import { getFullOvertimeData } from '@/lib/overtime-service';
import { getServerSession } from '@/lib/auth-guard';

async function DashboardContainer() {
  await connection();
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }
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
