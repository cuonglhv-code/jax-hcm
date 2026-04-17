import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

const teal = '#01696f'
const grey = '#6b7280'
const lightGrey = '#f3f4f6'
const darkText = '#111827'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: darkText, padding: 40 },
  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  companyName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: teal },
  companyTagline: { fontSize: 9, color: grey, marginTop: 2 },
  payslipLabel: { fontSize: 14, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  payslipMeta: { fontSize: 9, color: grey, textAlign: 'right', marginTop: 3 },
  // Divider
  divider: { borderBottomWidth: 1, borderBottomColor: teal, marginVertical: 12 },
  // Employee section
  twoCol: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  colLeft: { flex: 1 },
  colRight: { flex: 1, alignItems: 'flex-end' },
  label: { fontSize: 8, color: grey, marginBottom: 2, textTransform: 'uppercase' },
  value: { fontSize: 10, marginBottom: 6 },
  // Table
  tableHeader: { flexDirection: 'row', backgroundColor: lightGrey, padding: 6, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  tableRow: { flexDirection: 'row', padding: 6, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tableTotal: { flexDirection: 'row', padding: 6, backgroundColor: lightGrey },
  colDesc: { flex: 3 },
  colAmt: { flex: 1, textAlign: 'right' },
  bold: { fontFamily: 'Helvetica-Bold' },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 14, marginBottom: 4 },
  // Net Pay
  netPayBox: { backgroundColor: teal, padding: 16, borderRadius: 4, marginTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netPayLabel: { color: '#fff', fontSize: 10 },
  netPayAmount: { color: '#fff', fontSize: 24, fontFamily: 'Helvetica-Bold' },
  // Footer
  footer: { marginTop: 22, fontSize: 8, color: grey, textAlign: 'center' },
})

function money(amount: number, currency = 'GBP'): string {
  const sym = currency === 'GBP' ? '£' : '$'
  return `${sym}${Math.abs(amount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export interface PayslipWithEmployee {
  id: string
  gross_pay: number
  net_pay: number
  tax: number
  national_insurance: number
  total_allowances: number
  total_deductions: number
  breakdown: string | Array<{ label: string; amount: number; type: string }>
  paid_at?: string
  period_start?: string
  period_end?: string
  run_name?: string
  employee_number?: string
  first_name: string
  last_name: string
  job_title?: string
  department?: string
  currency?: string
}

export async function generatePayslipPDF(payslip: PayslipWithEmployee): Promise<Buffer> {
  const breakdown: Array<{ label: string; amount: number; type: string }> =
    typeof payslip.breakdown === 'string' ? JSON.parse(payslip.breakdown) : (payslip.breakdown ?? [])

  const earnings = breakdown.filter(b => b.type === 'earning')
  const deductions = breakdown.filter(b => b.type === 'deduction')
  const cur = payslip.currency ?? 'GBP'

  const periodStr = payslip.period_start && payslip.period_end
    ? `${new Date(payslip.period_start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} – ${new Date(payslip.period_end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
    : payslip.run_name ?? '—'

  const payDate = payslip.paid_at
    ? new Date(payslip.paid_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : payslip.period_end
      ? new Date(payslip.period_end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—'

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>Jaxtina HCM</Text>
            <Text style={styles.companyTagline}>Human Capital Management</Text>
          </View>
          <View>
            <Text style={styles.payslipLabel}>PAYSLIP</Text>
            <Text style={styles.payslipMeta}>{periodStr}</Text>
            <Text style={styles.payslipMeta}>ID: {payslip.id.substring(0, 8).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Employee info */}
        <View style={styles.twoCol}>
          <View style={styles.colLeft}>
            <Text style={styles.label}>Employee Name</Text>
            <Text style={[styles.value, styles.bold]}>{payslip.first_name} {payslip.last_name}</Text>
            <Text style={styles.label}>Job Title</Text>
            <Text style={styles.value}>{payslip.job_title ?? '—'}</Text>
            <Text style={styles.label}>Department</Text>
            <Text style={styles.value}>{payslip.department ?? '—'}</Text>
            <Text style={styles.label}>Employee ID</Text>
            <Text style={styles.value}>{payslip.employee_number ?? '—'}</Text>
          </View>
          <View style={styles.colRight}>
            <Text style={styles.label}>Pay Period</Text>
            <Text style={styles.value}>{periodStr}</Text>
            <Text style={styles.label}>Pay Date</Text>
            <Text style={styles.value}>{payDate}</Text>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>Bank Transfer</Text>
          </View>
        </View>

        {/* Earnings */}
        <Text style={styles.sectionTitle}>Earnings</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.colDesc, styles.bold]}>Description</Text>
          <Text style={[styles.colAmt, styles.bold]}>Amount ({cur})</Text>
        </View>
        {earnings.map((e, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colDesc}>{e.label}</Text>
            <Text style={styles.colAmt}>{money(e.amount, cur)}</Text>
          </View>
        ))}
        <View style={styles.tableTotal}>
          <Text style={[styles.colDesc, styles.bold]}>Gross Pay</Text>
          <Text style={[styles.colAmt, styles.bold]}>{money(Number(payslip.gross_pay), cur)}</Text>
        </View>

        {/* Deductions */}
        <Text style={styles.sectionTitle}>Deductions</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.colDesc, styles.bold]}>Description</Text>
          <Text style={[styles.colAmt, styles.bold]}>Amount ({cur})</Text>
        </View>
        {deductions.map((d, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colDesc}>{d.label}</Text>
            <Text style={styles.colAmt}>-{money(d.amount, cur)}</Text>
          </View>
        ))}
        <View style={styles.tableRow}>
          <Text style={styles.colDesc}>Income Tax</Text>
          <Text style={styles.colAmt}>-{money(Number(payslip.tax), cur)}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.colDesc}>National Insurance</Text>
          <Text style={styles.colAmt}>-{money(Number(payslip.national_insurance), cur)}</Text>
        </View>
        <View style={styles.tableTotal}>
          <Text style={[styles.colDesc, styles.bold]}>Total Deductions</Text>
          <Text style={[styles.colAmt, styles.bold]}>
            -{money(Number(payslip.tax) + Number(payslip.national_insurance) + Number(payslip.total_deductions), cur)}
          </Text>
        </View>

        {/* Net Pay */}
        <View style={styles.netPayBox}>
          <Text style={styles.netPayLabel}>NET PAY</Text>
          <Text style={styles.netPayAmount}>{money(Number(payslip.net_pay), cur)}</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This is a computer-generated payslip and does not require a signature.{'\n'}
          Jaxtina HCM · Human Capital Management · payroll@jaxtina.com
        </Text>
      </Page>
    </Document>
  )

  return renderToBuffer(doc) as Promise<Buffer>
}
