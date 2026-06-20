import jsPDF from 'jspdf'
import { parseResult } from './parseResult'

export function generatePDF(rawResult) {
  const doc   = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const W     = 210
  const M     = 18
  const lineH = 6
  const pageH = 297
  let y       = 22

  const checkPage = (needed = 10) => {
    if (y + needed > pageH - 16) { doc.addPage(); y = 22 }
  }

  // Header bar
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, W, 16, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('MediScribe AI — Clinical Report', M, 11)
  doc.setFontSize(7.5)
  doc.text(new Date().toLocaleString(), W - M, 11, { align: 'right' })

  y = 28
  doc.setTextColor(30, 41, 59)

  const p = parseResult(rawResult)

  if (Object.keys(p.sections).length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(37, 99, 235)
    doc.text('CLINICAL NOTE', M, y)
    y += 8

    for (const [key, val] of Object.entries(p.sections)) {
      checkPage(16)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(71, 85, 105)
      doc.text(key.toUpperCase(), M, y)
      y += 5

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(30, 41, 59)
      const wrapped = doc.splitTextToSize(val || 'Not Mentioned', W - M * 2)
      for (const line of wrapped) {
        checkPage(6)
        doc.text(line, M, y)
        y += lineH
      }
      y += 3
    }
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(30, 41, 59)
    const lines = doc.splitTextToSize(rawResult, W - M * 2)
    for (const line of lines) {
      checkPage(5)
      doc.text(line, M, y)
      y += 5
    }
  }

  if (p.jsonData) {
    checkPage(20)
    y += 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(37, 99, 235)
    doc.text('STRUCTURED DATA', M, y)
    y += 8
    doc.setFont('courier', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(30, 41, 59)
    const jsonLines = doc.splitTextToSize(JSON.stringify(p.jsonData, null, 2), W - M * 2)
    for (const line of jsonLines) {
      checkPage(4.5)
      doc.text(line, M, y)
      y += 4.5
    }
  }

  // Footer on every page
  const total = doc.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFillColor(248, 250, 252)
    doc.rect(0, pageH - 11, W, 11, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(100, 116, 139)
    doc.text('AI-generated — verify with a licensed clinician before clinical use.', M, pageH - 4)
    doc.text(`Page ${i} / ${total}`, W - M, pageH - 4, { align: 'right' })
  }

  doc.save(`clinical-note-${new Date().toISOString().slice(0, 10)}.pdf`)
}
