'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';

export interface DatePickerProps {
  id?: string;
  label?: string;
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  id = 'date-picker',
  label,
  date,
  onDateChange,
  placeholder = 'Pilih tanggal',
  className = 'w-full',
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(date);

  React.useEffect(() => {
    if (date !== undefined) {
      setInternalDate(date);
    }
  }, [date]);

  const selectedDate = date !== undefined ? date : internalDate;

  const handleSelect = (newDate: Date | undefined) => {
    setInternalDate(newDate);
    onDateChange?.(newDate);
    setOpen(false);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <Label htmlFor={id} className="text-xs font-semibold text-[#1E293B] px-0.5">
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              id={id}
              disabled={disabled}
              className="w-full justify-between font-normal text-xs h-9 bg-white border-slate-200 hover:border-[#00A2E9] hover:bg-[#F4F7FA] text-[#1E293B] cursor-pointer"
            />
          }
        >
          <span className="flex items-center text-xs">
            <CalendarIcon className="mr-2 size-3.5 text-[#00A2E9]" />
            <span className={selectedDate ? 'text-[#005596] font-bold' : 'text-[#64748B]'}>
              {selectedDate
                ? selectedDate.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : placeholder}
            </span>
          </span>
          <ChevronDownIcon className="size-3.5 text-[#00A2E9]" />
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0 z-50 rounded-xl shadow-xl border-slate-200" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { default as DatePickerWithIconDemo } from './date-picker-03';
