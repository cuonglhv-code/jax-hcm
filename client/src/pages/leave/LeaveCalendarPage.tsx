import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTeamCalendar, usePublicHolidays } from '@/hooks/useLeave'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/shared/components/Button'
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, isWeekend } from 'date-fns'

const PALETTE = ['var(--color-primary)', '#7c3aed', '#0891b2', '#d97706', '#059669', '#dc2626']

function hashColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export default function LeaveCalendarPage() {
  const { user } = useAuth()
  const [current, setCurrent] = useState(new Date())
  const month = current.getMonth() + 1
  const year = current.getFullYear()

  const { data: calData } = useTeamCalendar(user?.id, month, year)
  const { data: phData } = usePublicHolidays(undefined, year)

  const events = calData?.data ?? []
  const holidays = phData?.data ?? []

  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) })
  const startPad = getDay(startOfMonth(current))

  const getEventsForDay = (day: Date) =>
    events.filter((e: any) => {
      const s = new Date(e.startDate); const en = new Date(e.endDate)
      return day >= s && day <= en
    })

  const getHolidaysForDay = (day: Date) =>
    holidays.filter((h: any) => isSameDay(new Date(h.date), day))

  return (
    <div>
      <PageHeader
        title="Team Calendar"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCurrent(subMonths(current, 1))}>←</Button>
            <span className="font-medium text-sm min-w-[140px] text-center">{format(current, 'MMMM yyyy')}</span>
            <Button variant="ghost" size="sm" onClick={() => setCurrent(addMonths(current, 1))}>→</Button>
          </div>
        }
      />

      <div className="card p-0 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-divider">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-text-muted py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} className="border-r border-b border-divider min-h-[80px]" />)}
          {days.map(day => {
            const dayEvents = getEventsForDay(day)
            const dayHolidays = getHolidaysForDay(day)
            return (
              <div
                key={day.toISOString()}
                className={`border-r border-b border-divider min-h-[80px] p-1 text-xs
                  ${isToday(day) ? 'bg-primary/5' : ''}
                  ${isWeekend(day) ? 'bg-surface-offset/50' : ''}
                `}
              >
                <div className={`font-medium mb-1 ${isToday(day) ? 'text-primary' : 'text-text-muted'}`}>
                  {format(day, 'd')}
                </div>
                {dayEvents.slice(0, 2).map((e: any) => (
                  <div
                    key={e.id}
                    className="truncate px-1 py-0.5 rounded text-white text-[10px] mb-0.5"
                    style={{ backgroundColor: hashColor(e.employeeId ?? e.id) }}
                    title={`${e.employee?.firstName} ${e.employee?.lastName}`}
                  >
                    {e.employee?.firstName ?? 'Leave'}
                  </div>
                ))}
                {dayEvents.length > 2 && <div className="text-[10px] text-text-faint">+{dayEvents.length - 2} more</div>}
                {dayHolidays.map((h: any) => (
                  <div key={h.id} className="truncate px-1 py-0.5 rounded bg-surface-offset text-text-muted text-[10px]">{h.name}</div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
