import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { 
    fontFamily: 'Helvetica', 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  borderWrap: {
    border: '4px solid #01696f',
    padding: '2px',
    height: '100%'
  },
  innerBorder: {
    border: '1px solid #01696f',
    height: '100%',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  logo: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: '#01696f',
    marginBottom: 40
  },
  heading: {
    fontSize: 48,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 30,
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  presentedTo: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    fontStyle: 'italic'
  },
  name: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: '#01696f',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 10,
    width: '80%',
    textAlign: 'center'
  },
  forCompleting: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20
  },
  courseName: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 40,
    textAlign: 'center'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 40,
    paddingHorizontal: 30
  },
  signBlock: {
    alignItems: 'center',
    width: 150
  },
  signLine: {
    borderTopWidth: 1,
    borderTopColor: '#111827',
    width: '100%',
    marginTop: 30,
    marginBottom: 5
  },
  signText: {
    fontSize: 12,
    color: '#111827'
  },
  certNumber: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    fontSize: 9,
    color: '#9ca3af'
  }
})

export interface CertificateData {
  employeeName: string
  courseName: string
  completionDate: string
  certificateNumber: string
}

export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  const formattedDate = new Date(data.completionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  
  const doc = (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.borderWrap}>
          <View style={styles.innerBorder}>
            <Text style={styles.logo}>Jaxtina Learning</Text>
            
            <Text style={styles.heading}>Certificate of Completion</Text>
            
            <Text style={styles.presentedTo}>This is proudly presented to</Text>
            
            <Text style={styles.name}>{data.employeeName}</Text>
            
            <Text style={styles.forCompleting}>For successfully completing the course</Text>
            
            <Text style={styles.courseName}>{data.courseName}</Text>
            
            <View style={styles.footer}>
              <View style={styles.signBlock}>
                <Text style={styles.signText}>{formattedDate}</Text>
                <View style={styles.signLine} />
                <Text style={styles.signText}>Date Completed</Text>
              </View>
              
              <View style={styles.signBlock}>
                <Text style={{ fontFamily: 'Times-Italic', fontSize: 20, marginTop: 5 }}>Jaxtina L&amp;D</Text>
                <View style={styles.signLine} />
                <Text style={styles.signText}>Learning &amp; Development</Text>
              </View>
            </View>
            
            <Text style={styles.certNumber}>ID: {data.certificateNumber.toUpperCase()}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )

  return renderToBuffer(doc) as Promise<Buffer>
}
