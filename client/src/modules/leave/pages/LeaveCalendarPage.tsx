import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../../services/api';
import { Badge } from '../../../components/Badge';

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function LeaveCalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const { data: leaves } = useQuery({
    queryKey: ['leave-calendar', year, month],
    queryFn: () => api.get('/leave/calendar', { params: { year, month } }).then(r => r.data.data),
  });

  const { data: holidays } = useQuery({
    queryKey: ['public-holidays', year],
    queryFn: () => api.get('/leave/public-holidays', { params: { year } }).then(r => r.data.data),
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const leaveDays = leaves ?? [];
  const holidayDates = new Set((holidays ?? []).map((h: { date: string }) => h.date.slice(0, 10)));

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const monthName = new Date(year, month - 1).toLocaleString('en-GB', { month: 'long' });

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Leave Calendar</h1>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-base font-semibold text-gray-800 dark:text-gray-100 min-w-[140px] text-center">
            {monthName} {year}
          </span>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="glass-card p-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-xs font-semibold text-gray-400 uppercase text-center py-2">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
            const isHoliday = holidayDates.has(dateStr);
            const dayLeaves = leaveDays.filter((l: { start_date: string; end_date: string }) =>
              dateStr >= l.start_date.slice(0, 10) && dateStr <= l.end_date.slice(0, 10));

            return (
              <div key={day} className={`min-h-[80px] rounded-lg p-1.5 ${isHoliday ? 'bg-amber-50 dark:bg-amber-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'} transition-colors`}>
                <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-brand-600 text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  {day}
                </div>
                {isHoliday && (
                  <div className="text-[9px] text-amber-600 font-medium truncate">Holiday</div>
                )}
                {dayLeaves.slice(0, 2).map((l: { leave_type_color: string; employee_name: string }, li: number) => (
                  <div key={li}
                    className="text-[9px] rounded px-1 py-0.5 truncate font-medium text-white"
                    style={{ backgroundColor: l.leave_type_color }}
                  >
                    {l.employee_name.split(' ')[0]}
                  </div>
                ))}
                {dayLeaves.length > 2 && (
                  <div className="text-[9px] text-gray-400">+{dayLeaves.length - 2}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
