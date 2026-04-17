import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useClockIn, useClockOut, useAttendance, useExportAttendance } from '@/hooks/useLeave'
import { PageHeader } from '@/shared/components/PageHeader'
import { KpiCard } from '@/shared/components/KpiCard'
import { Table } from '@/shared/components/Table'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { DatePicker } from '@/shared/components/DatePicker'
import { useToast } from '@/shared/components/Toast'
import { Clock } from 'lucide-react'
import { format, differenceInMinutes } from 'date-fns'

export default function AttendancePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [from, setFrom] = useState(''); const [to, setTo] = useState('')
  const [notes, setNotes] = useState('')

  const { data, isLoading } = useAttendance(user?.id, { from: from || undefined, to: to || undefined, page, limit: 20 })
  const clockIn = useClockIn()
  const clockOut = useClockOut()
  const exportAtt = useExportAttendance()

  const records = data?.data ?? []
  const meta = data?.meta
  const todayRecord = records.find((r: any) => {
    const d = new Date(r.clockIn)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  })
  const isClockedIn = todayRecord && !todayRecord.clockOut
  const hoursToday = todayRecord ? (() => {
    const mins = differenceInMinutes(todayRecord.clockOut ? new Date(todayRecord.clockOut) : new Date(), new Date(todayRecord.clockIn))
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  })() : '—'

  const handleClockIn = async () => {
    try {
      await clockIn.mutateAsync({ notes })
      toast({ message: 'Clocked in!', variant: 'success' })
      setNotes('')
    } catch { toast({ message: 'Failed to clock in', variant: 'error' }) }
  }

  const handleClockOut = async () => {
    try {
      await clockOut.mutateAsync({ notes })
      toast({ message: 'Clocked out!', variant: 'success' })
    } catch { toast({ message: 'Failed to clock out', variant: 'error' }) }
  }

  const handleExport = async () => {
    try {
      const blob = await exportAtt.mutateAsync({ employeeId: user?.id, from, to })
      const url = URL.createObjectURL(new Blob([blob], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url; a.download = 'attendance.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast({ message: 'Export failed', variant: 'error' }) }
  }

  const columns = [
    { key: 'date', header: 'Date', render: (r: any) => r.clockIn ? format(new Date(r.clockIn), 'dd MMM yyyy') : '—' },
    { key: 'clockIn', header: 'Clock In', render: (r: any) => r.clockIn ? format(new Date(r.clockIn), 'HH:mm') : '—' },
    { key: 'clockOut', header: 'Clock Out', render: (r: any) => r.clockOut ? format(new Date(r.clockOut), 'HH:mm') : <span className="text-warning text-xs">Still in</span> },
    { key: 'hours', header: 'Hours', render: (r: any) => {
      if (!r.clockIn) return '—'
      const mins = differenceInMinutes(r.clockOut ? new Date(r.clockOut) : new Date(), new Date(r.clockIn))
      return `${Math.floor(mins / 60)}h ${mins % 60}m`
    }},
    { key: 'notes', header: 'Notes', render: (r: any) => r.notes ?? '—' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" />

      <div className="grid grid-cols-2 gap-4">
        <KpiCard label="Today's Status" value={isClockedIn ? 'Clocked In 🟢' : 'Not Clocked In'} icon={Clock} />
        <KpiCard label="Hours Today" value={hoursToday} />
      </div>

      <div className="card space-y-4 max-w-sm">
        {!isClockedIn ? (
          <>
            <Input label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Working from home" />
            <Button className="w-full" onClick={handleClockIn} loading={clockIn.isPending} size="lg">🕐 Clock In</Button>
          </>
        ) : (
          <>
            <div className="text-sm text-text-muted">
              Clocked in at <span className="font-medium text-text-base">{todayRecord?.clockIn ? format(new Date(todayRecord.clockIn), 'HH:mm') : '—'}</span>
            </div>
            <Button className="w-full" variant="secondary" onClick={handleClockOut} loading={clockOut.isPending} size="lg">✅ Clock Out</Button>
          </>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-base">Attendance Records</h2>
          <div className="flex items-center gap-3">
            <DatePicker label="" isRange startDate={from} endDate={to} onRangeChange={(s, e) => { setFrom(s); setTo(e) }} />
            <Button size="sm" variant="secondary" onClick={handleExport} loading={exportAtt.isPending}>Export CSV</Button>
          </div>
        </div>
        <Table
          columns={columns}
          data={records}
          isLoading={isLoading}
          pagination={meta ? { page: meta.page, limit: meta.limit, total: meta.total, totalPages: meta.totalPages, onPageChange: setPage } : undefined}
        />
      </div>
    </div>
  )
}
