import { NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { formatMetricName, formatMetricValue } from '@/lib/pdfUtils'

export async function POST(req: Request) {
  const data = await req.json()
  
  const doc = new jsPDF()
  
  // Add content to PDF
  generatePDFContent(doc, data)
  
  const pdfBytes = doc.output('arraybuffer')
  
  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=network-report.pdf',
    },
  })
}

async function generatePDFContent(doc: jsPDF, data: any) {
  // Add custom font
  doc.setFont('Helvetica')

  // Cover Page
  createCoverPage(doc, data)
  
  // Summary Page
  doc.addPage()
  createSummaryPage(doc, data)
  
  // Detailed Metrics Pages
  doc.addPage()
  createDetailedMetricsPages(doc, data)
  
  // Recommendations Page
  doc.addPage()
  createRecommendationsPage(doc, data)

  // Add page numbers to all pages except cover
  const pageCount = doc.getNumberOfPages()
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i)
    addFooter(doc, i, pageCount)
  }
}

function createCoverPage(doc: jsPDF, data: any) {
  // Background color
  doc.setFillColor(240, 242, 245)
  doc.rect(0, 0, 210, 297, 'F')

  // Decorative header bar
  doc.setFillColor(66, 133, 244)
  doc.rect(0, 0, 210, 40, 'F')

  // Title
  doc.setFontSize(28)
  doc.setTextColor(255, 255, 255)
  doc.text('Network Performance Report', 105, 25, { align: 'center' })

  // Subtitle
  doc.setFontSize(14)
  doc.setTextColor(80, 80, 80)
  doc.text('Comparative Analysis & Insights', 105, 60, { align: 'center' })

  // Network Names
  doc.setFontSize(16)
  doc.setTextColor(66, 133, 244)
  doc.text(`${data.metrics.l2.name || 'L2'} vs ${data.metrics.linea.name || 'Linea'}`, 105, 75, { align: 'center' })

  // Key Metrics Preview
  const yStart = 100
  const metrics = [
    { label: 'Average TPS', l2: data.metrics.l2.averageTPS, linea: data.metrics.linea.averageTPS },
    { label: 'Success Rate', l2: data.metrics.l2.successRate, linea: data.metrics.linea.successRate },
    { label: 'Gas Cost', l2: data.metrics.l2.averageGasCost, linea: data.metrics.linea.averageGasCost }
  ]

  metrics.forEach((metric, index) => {
    const y = yStart + (index * 40)
    createMetricPreview(doc, metric, y)
  })

  // Date and Time
  doc.setFontSize(10)
  doc.setTextColor(128, 128, 128)
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    105,
    270,
    { align: 'center' }
  )
}

function createMetricPreview(doc: jsPDF, metric: any, y: number) {
  // Metric box
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(20, y, 170, 30, 3, 3, 'F')
  
  // Label
  doc.setFontSize(12)
  doc.setTextColor(80, 80, 80)
  doc.text(metric.label, 30, y + 12)
  
  // Values
  doc.setFontSize(14)
  doc.setTextColor(66, 133, 244)
  const l2Value = formatMetricValue(metric.label, metric.l2)
  const lineaValue = formatMetricValue(metric.label, metric.linea)
  
  // Center-align values
  doc.text(l2Value, 100, y + 20, { align: 'right' })
  doc.text('vs', 115, y + 20, { align: 'center' })
  doc.text(lineaValue, 130, y + 20, { align: 'left' })
}

function createSummaryPage(doc: jsPDF, data: any) {
  addPageHeader(doc, 'Performance Summary')

  // Summary table
  const summaryData = [
    ['Metric', 'L2', 'Linea', 'Difference'],
    ...Object.entries(data.metrics.l2).map(([key, value]: [string, any]) => {
      const lineaValue = data.metrics.linea[key]
      const diff = calculateDifference(value, lineaValue)
      return [
        formatMetricName(key),
        formatMetricValue(key, value),
        formatMetricValue(key, lineaValue),
        formatDifference(diff)
      ]
    })
  ]

  doc.autoTable({
    startY: 50,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [66, 133, 244],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      3: { 
        cellWidth: 40,
        halign: 'center',
      },
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  })
}

function createDetailedMetricsPages(doc: jsPDF, data: any) {
  addPageHeader(doc, 'Detailed Metrics Analysis')

  let yPos = 50
  Object.entries(data.metrics).forEach(([network, metrics]: [string, any]) => {
    // Network section header
    doc.setFontSize(14)
    doc.setTextColor(66, 133, 244)
    doc.text(`${network.toUpperCase()} Network`, 14, yPos)
    yPos += 10

    // Metrics table
    const tableData = Object.entries(metrics).map(([key, value]: [string, any]) => [
      formatMetricName(key),
      formatMetricValue(key, value)
    ])

    doc.autoTable({
      startY: yPos,
      head: [['Metric', 'Value']],
      body: tableData,
      theme: 'striped',
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [66, 133, 244],
        textColor: [255, 255, 255],
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
      },
      margin: { left: 14 },
    })

    yPos = (doc as any).lastAutoTable.finalY + 20

    if (yPos > 250) {
      doc.addPage()
      addPageHeader(doc, 'Detailed Metrics Analysis (Continued)')
      yPos = 50
    }
  })
}

function createRecommendationsPage(doc: jsPDF, data: any) {
  addPageHeader(doc, 'Recommendations & Insights')

  let yPos = 50

  if (data.recommendations && data.recommendations.length > 0) {
    data.recommendations.forEach((rec: string, index: number) => {
      // Recommendation box
      doc.setFillColor(245, 247, 250)
      doc.roundedRect(14, yPos, 182, 30, 3, 3, 'F')

      // Number bubble
      doc.setFillColor(66, 133, 244)
      doc.circle(24, yPos + 15, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.text((index + 1).toString(), 24, yPos + 15, { align: 'center' })

      // Recommendation text
      doc.setTextColor(80, 80, 80)
      doc.setFontSize(10)
      const lines = doc.splitTextToSize(rec, 155)
      doc.text(lines, 40, yPos + 12)

      yPos += 40

      if (yPos > 250) {
        doc.addPage()
        addPageHeader(doc, 'Recommendations & Insights (Continued)')
        yPos = 50
      }
    })
  } else {
    doc.setTextColor(128, 128, 128)
    doc.setFontSize(12)
    doc.text('No recommendations at this time.', 105, 100, { align: 'center' })
  }
}

function addPageHeader(doc: jsPDF, title: string) {
  // Header background
  doc.setFillColor(66, 133, 244)
  doc.rect(0, 0, 210, 30, 'F')

  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text(title, 105, 20, { align: 'center' })
}

function addFooter(doc: jsPDF, currentPage: number, pageCount: number) {
  // Footer line
  doc.setDrawColor(200, 200, 200)
  doc.line(20, 280, 190, 280)

  // Page numbers
  doc.setFontSize(10)
  doc.setTextColor(128, 128, 128)
  doc.text(`Page ${currentPage} of ${pageCount}`, 105, 288, { align: 'center' })
}

function calculateDifference(value1: number, value2: number): number {
  return ((value1 - value2) / value2) * 100
}

function formatDifference(diff: number): string {
    const arrow = diff > 0 ? '↑' : '↓'
    return `${Math.abs(diff).toFixed(2)}% ${arrow}`
  }
