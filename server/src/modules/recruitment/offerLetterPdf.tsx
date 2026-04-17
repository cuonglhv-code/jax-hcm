import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 11, padding: 50, color: '#111827', lineHeight: 1.5 },
  header: { marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#01696f', paddingBottom: 10 },
  companyName: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#01696f' },
  tagline: { fontSize: 10, color: '#6b7280' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, marginBottom: 30 },
  date: { fontSize: 11 },
  candidateName: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  title: { fontSize: 16, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 20 },
  body: { marginBottom: 15 },
  detailsTable: { marginTop: 15, marginBottom: 25 },
  row: { flexDirection: 'row', marginBottom: 8 },
  label: { width: 120, fontFamily: 'Helvetica-Bold' },
  value: { flex: 1 },
  signatureSection: { marginTop: 50, flexDirection: 'row', justifyContent: 'space-between' },
  signBox: { width: 200 },
  signLine: { borderTopWidth: 1, borderTopColor: '#000', marginTop: 40, marginBottom: 5 },
})

export interface OfferLetterData {
  candidateName: string
  jobTitle: string
  department: string
  salary: number
  currency: string
  startDate: string
  managerName?: string
}

export async function generateOfferLetterPDF(data: OfferLetterData): Promise<Buffer> {
  const formattedSalary = new Intl.NumberFormat('en-GB', { style: 'currency', currency: data.currency }).format(data.salary)
  const formattedStart = new Date(data.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>Jaxtina HCM</Text>
          <Text style={styles.tagline}>Future of Work, Today.</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.candidateName}>{data.candidateName}</Text>
          <Text style={styles.date}>Date: {today}</Text>
        </View>

        <Text style={styles.title}>Offer of Employment</Text>

        <Text style={styles.body}>Dear {data.candidateName},</Text>
        <Text style={styles.body}>We are delighted to offer you employment with Jaxtina HCM as a {data.jobTitle} within the {data.department} department. We believe your skills and experience will be a valuable asset to our team.</Text>

        <View style={styles.detailsTable}>
          <View style={styles.row}>
            <Text style={styles.label}>Position:</Text>
            <Text style={styles.value}>{data.jobTitle}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Department:</Text>
            <Text style={styles.value}>{data.department}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Base Salary:</Text>
            <Text style={styles.value}>{formattedSalary} per annum</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Start Date:</Text>
            <Text style={styles.value}>{formattedStart}</Text>
          </View>
          {data.managerName && (
            <View style={styles.row}>
              <Text style={styles.label}>Reporting To:</Text>
              <Text style={styles.value}>{data.managerName}</Text>
            </View>
          )}
        </View>

        <Text style={styles.body}>This offer is contingent upon the successful completion of our background check procedures and your acceptance of our standard employment terms and conditions.</Text>
        <Text style={styles.body}>Please sign and return a copy of this letter by next week to indicate your acceptance. We look forward to welcoming you to the team!</Text>

        <View style={styles.signatureSection}>
          <View style={styles.signBox}>
            <Text>For Jaxtina HCM:</Text>
            <View style={styles.signLine} />
            <Text>Authorized Signatory</Text>
          </View>
          <View style={styles.signBox}>
            <Text>Accepted By:</Text>
            <View style={styles.signLine} />
            <Text>{data.candidateName}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )

  return renderToBuffer(doc) as Promise<Buffer>
}
