'use client';

import * as React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Search, CalendarDays } from 'lucide-react';

export function DashboardHeader() {
  const [currentDate, setCurrentDate] = React.useState('');

  React.useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    );
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
      {/* Left items: Sidebar trigger & breadcrumb */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Penjadwalan Tim Divisi</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right items: Search, date & notifications */}
      <div className="flex items-center gap-3">
        <div className="relative hidden w-64 md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari jadwal, personil, atau divisi..."
            className="h-9 w-full rounded-lg pl-9 text-xs"
          />
        </div>

        <div className="hidden lg:flex items-center gap-1.5 rounded-lg border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5 text-primary" />
          <span>{currentDate || 'Memuat...'}</span>
        </div>

        <Button variant="outline" size="icon" className="relative size-9 rounded-lg">
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
          <span className="sr-only">Notifikasi</span>
        </Button>
      </div>
    </header>
  );
}
