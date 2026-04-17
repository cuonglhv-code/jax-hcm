import React, { useState } from 'react'
import { useCycles, usePerformanceDashboard } from '@/hooks/usePerformance'
import { PageHeader } from '@/shared/components/PageHeader'
import { KpiCard } from '@/shared/components/KpiCard'
import { Select } from '@/shared/components/Select'
import { EmptyState } from '@/shared/components/EmptyState'
import { BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function PerformanceDashboardPage() {
  const { data: cyclesData } = useCycles({})
  const cycles = cyclesData?.data ?? []
  const activeCycle = cycles.find((c: any) => c.isActive)
  const [cycleId, setCycleId] = useState(activeCycle?.id ?? '')

  const { data, isLoading } = usePerformanceDashboard(cycleId)
  const dashboard = data?.data

  const kpis = [
    { label: 'Total Appraisals', value: dashboard?.totalAppraisals ?? '—' },
    { label: 'Completed', value: dashboard?.completed ?? '—' },
    { label: 'In Progress', value: dashboard?.inProgress ?? '—' },
    { label: 'Avg Rating', value: dashboard?.avgRating ? `${Number(dashboard.avgRating).toFixed(1)}/10` : '—' },
  ]

  const chartData = dashboard?.departments ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Dashboard"
        subtitle="Appraisal cycle insights"
        actions={
          <Select
            value={cycleId}
            onChange={e => setCycleId(e.target.value)}
            options={[{ value: '', label: 'All Cycles' }, ...cycles.map((c: any) => ({ value: c.id, label: c.name }))]}
            className="w-48"
          />
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={i} label={kpi.label} value={kpi.value} isLoading={isLoading} />
        ))}
      </div>

      {chartData.length === 0 && !isLoading ? (
        <EmptyState icon={BarChart3} title="No data for this cycle" description="Select an active cycle to view performance metrics." />
      ) : (
        <>
          <div className="card">
            <h2 className="font-display font-bold text-base mb-4">Completion by Department</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis unit="%" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Bar dataKey="completionRate" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card overflow-x-auto">
            <h2 className="font-display font-bold text-base mb-4">Department Summary</h2>
            <table className="w-full text-sm">
              <thead className="border-b border-divider text-text-muted">
                <tr>
                  <th className="py-2 text-left font-medium">Department</th>
                  <th className="py-2 text-right font-medium">Total</th>
                  <th className="py-2 text-right font-medium">Done</th>
                  <th className="py-2 text-right font-medium">Avg Rating</th>
                  <th className="py-2 text-left pl-4 font-medium">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {chartData.map((row: any) => (
                  <tr key={row.department} className="hover:bg-surface-offset">
                    <td className="py-2">{row.department}</td>
                    <td className="py-2 text-right">{row.total}</td>
                    <td className="py-2 text-right">{row.completed}</td>
                    <td className="py-2 text-right">{row.avgRating ? Number(row.avgRating).toFixed(1) : '—'}</td>
                    <td className="py-2 pl-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-surface-offset rounded-full h-1.5 w-24">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${row.completionRate ?? 0}%` }} />
                        </div>
                        <span className="text-xs text-text-muted">{Math.round(row.completionRate ?? 0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
