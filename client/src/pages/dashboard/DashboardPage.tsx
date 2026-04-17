import React from 'react'
import { useNavigate } from 'react-router-dom'
import { format, getHours } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import { useEmployees } from '@/hooks/useEmployees'
import { useRequisitions } from '@/hooks/useRecruitment'
import { useLeaveRequests, useLeaveBalance } from '@/hooks/useLeave'
import { useGoals } from '@/hooks/usePerformance'
import { useEmployeePayslips } from '@/hooks/usePayroll'
import { PageHeader } from '@/shared/components/PageHeader'
import { KpiCard } from '@/shared/components/KpiCard'
import { Badge } from '@/shared/components/Badge'
import { Users, Briefcase, CalendarX2, Target, ArrowRight } from 'lucide-react'
import { format as fmt } from 'date-fns'

function greeting(name: string): string {
  const h = getHours(new Date())
  const prefix = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  return `${prefix}, ${name}`
}

const STATUS_BADGE: Record<string, 'warning' | 'success' | 'error' | 'neutral'> = {
  pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'neutral',
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: empData } = useEmployees({ limit: 1 })
  const { data: reqData } = useRequisitions({ status: 'open', limit: 1 })
  const { data: leaveData } = useLeaveRequests({ status: 'pending', limit: 1 })
  const { data: goalsData } = useGoals(user?.id)
  const { data: myLeaveData } = useLeaveRequests({ employeeId: user?.id, limit: 3 })
  const { data: balanceData } = useLeaveBalance(user?.id, new Date().getFullYear())
  const { data: payslipsData } = useEmployeePayslips(user?.id, { limit: 3 })

  const totalEmployees = empData?.meta?.total ?? '—'
  const openReqs = reqData?.meta?.total ?? '—'
  const pendingLeave = leaveData?.meta?.total ?? '—'
  const activeGoals = (goalsData?.data ?? []).filter((g: any) => (g.completionPercentage ?? 0) < 100).length

  const myRecentLeave = myLeaveData?.data ?? []
  const myPayslips = payslipsData?.data ?? []
  const balance = balanceData?.data ?? []

  const remainingDays = balance.reduce((acc: number, b: any) => acc + (b.remainingDays ?? 0), 0)

  const quickLinks = [
    { label: 'My Leave Balance', sub: `${remainingDays} days remaining`, href: '/leave', color: 'bg-info/10 text-info' },
    { label: 'My Goals', sub: `${activeGoals} active goals`, href: '/performance/goals', color: 'bg-warning/10 text-warning' },
    { label: 'My Learning', sub: 'Continue your courses', href: '/learning/my', color: 'bg-success/10 text-success' },
    { label: 'Team Calendar', sub: 'See who\'s out', href: '/leave/calendar', color: 'bg-primary/10 text-primary' },
  ]

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-base">{greeting(user?.firstName ?? user?.email ?? 'there')}</h1>
        <p className="text-text-muted text-sm mt-0.5">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Employees" value={totalEmployees} icon={Users} />
        <KpiCard label="Open Requisitions" value={openReqs} icon={Briefcase} />
        <KpiCard label="Pending Leave" value={pendingLeave} icon={CalendarX2} />
        <KpiCard label="Active Goals" value={activeGoals} icon={Target} />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        {quickLinks.map(link => (
          <button
            key={link.href}
            onClick={() => navigate(link.href)}
            className="card text-left hover:shadow-md transition-shadow flex items-center justify-between group"
          >
            <div>
              <div className="font-medium text-text-base">{link.label}</div>
              <div className="text-sm text-text-muted mt-0.5">{link.sub}</div>
            </div>
            <ArrowRight className="w-5 h-5 text-text-faint group-hover:text-primary transition-colors" />
          </button>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent leave */}
        <div className="card">
          <h2 className="font-display font-bold text-base mb-4">Recent Leave Requests</h2>
          {myRecentLeave.length === 0 ? (
            <div className="text-sm text-text-muted">No recent leave requests.</div>
          ) : (
            <div className="space-y-3">
              {myRecentLeave.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{r.leaveType?.name ?? 'Leave'}</span>
                    <span className="text-text-muted ml-2">{r.startDate ? fmt(new Date(r.startDate), 'dd MMM') : ''} – {r.endDate ? fmt(new Date(r.endDate), 'dd MMM yyyy') : ''}</span>
                  </div>
                  <Badge variant={STATUS_BADGE[r.status] ?? 'neutral'}>{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent payslips */}
        <div className="card">
          <h2 className="font-display font-bold text-base mb-4">Recent Payslips</h2>
          {myPayslips.length === 0 ? (
            <div className="text-sm text-text-muted">No payslips available yet.</div>
          ) : (
            <div className="space-y-3">
              {myPayslips.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{p.payrollRun?.name ?? 'Payslip'}</span>
                    {p.payrollRun?.periodStart && (
                      <span className="text-text-muted ml-2">{fmt(new Date(p.payrollRun.periodStart), 'MMM yyyy')}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-primary">${Number(p.netPay ?? 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
