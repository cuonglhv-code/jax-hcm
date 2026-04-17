import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePayslip } from '@/hooks/usePayroll'
import { Button } from '@/shared/components/Button'
import { Skeleton } from '@/shared/components/Skeleton'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'

export default function PayslipPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = usePayslip(id)
  const payslip = data?.data

  if (isLoading) return <div className="space-y-4"><Skeleton variant="heading" /><Skeleton variant="rect" height="400px" /></div>
  if (!payslip) return <div className="card text-text-muted">Payslip not found.</div>

  const allowances = payslip.allowances ?? []
  const deductions = payslip.deductions ?? []

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-muted hover:text-primary text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Run
      </button>

      <div className="card space-y-6">
        {/* Header */}
        <div className="text-center border-b border-divider pb-4">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-display text-xl font-bold mx-auto mb-3">J</div>
          <h1 className="font-display text-xl font-bold">Jaxtina HCM</h1>
          <p className="text-sm text-text-muted">Payslip</p>
        </div>

        {/* Employee info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-text-muted mb-1">Employee</div>
            <div className="font-medium">{payslip.employee?.firstName} {payslip.employee?.lastName}</div>
            <div className="text-text-muted">{payslip.employee?.jobTitle}</div>
            <div className="text-text-muted">{payslip.employee?.department?.name}</div>
          </div>
          <div>
            <div className="text-text-muted mb-1">Pay Period</div>
            <div className="font-medium">{payslip.payrollRun?.name}</div>
            <div className="text-text-muted">{payslip.payrollRun?.periodStart ? format(new Date(payslip.payrollRun.periodStart), 'dd MMM') : ''} – {payslip.payrollRun?.periodEnd ? format(new Date(payslip.payrollRun.periodEnd), 'dd MMM yyyy') : ''}</div>
          </div>
        </div>

        {/* Line items */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm py-2 border-b border-divider">
            <span className="text-text-muted">Base Salary</span>
            <span className="font-medium">${Number(payslip.grossPay || 0).toLocaleString()}</span>
          </div>
          {allowances.map((a: any, i: number) => (
            <div key={i} className="flex justify-between text-sm py-1">
              <span className="text-success">+ {a.name}</span>
              <span className="text-success">+${Number(a.amount).toLocaleString()}</span>
            </div>
          ))}
          {deductions.map((d: any, i: number) => (
            <div key={i} className="flex justify-between text-sm py-1">
              <span className="text-error">- {d.name}</span>
              <span className="text-error">-${Number(d.amount).toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm py-1">
            <span className="text-error">- Income Tax</span>
            <span className="text-error">-${Number(payslip.taxAmount || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Net */}
        <div className="border-t border-divider pt-4 flex justify-between items-center">
          <span className="font-display font-bold text-base">Total Net Pay</span>
          <span className="font-display font-bold text-2xl text-primary">${Number(payslip.netPay || 0).toLocaleString()}</span>
        </div>

        <Button variant="secondary" className="w-full" onClick={() => alert('PDF download coming soon')}>Download PDF</Button>
      </div>
    </div>
  )
}
