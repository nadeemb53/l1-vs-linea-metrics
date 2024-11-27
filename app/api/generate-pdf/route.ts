// app/api/generate-pdf/route.ts
import { NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { StoredData } from '@/lib/metricsStorage'
import { 
  formatTPS, 
  formatBlockTime, 
  formatGasPrice, 
  formatLatency, 
  formatPercent,
  formatNumber 
} from '@/lib/utils'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: { finalY: number };
  }
}

export async function POST(request: Request) {
  try {
    const data: StoredData = await request.json()
    const doc = new jsPDF()
    
    // Generate PDF content
    generatePdfReport(doc, data)
    
    const pdfBytes = doc.output('arraybuffer')
    
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=network-report.pdf',
      },
    })
  } catch (error) {
    console.error('Failed to generate PDF:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to generate PDF' }), 
      { status: 500 }
    )
  }
}

function generatePdfReport(doc: jsPDF, data: StoredData) {
  // Cover page
  generateCoverPage(doc, data)

  // Network metrics summary
  doc.addPage()
  generateMetricsSummary(doc, data)

  // Charts and trends if any stress tests exist
  if (data.stressTests && data.stressTests.length > 0) {
    doc.addPage()
    const stressTests = data.stressTests; // Type is narrowed here
    generateStressTestResults(doc, { ...data, stressTests })
  }

  // Add page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i)
    addPageNumber(doc, i, pageCount)
  }
}

function generateCoverPage(doc: jsPDF, data: StoredData) {
  // Header
  doc.setFillColor(66, 133, 244)
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.text('Network Performance Report', 105, 25, { align: 'center' })

  // Summary boxes
  const networks = ['l2', 'linea'] as const
  let yPos = 60

  networks.forEach(network => {
    const metrics = data.summaries[network]
    
    doc.setFillColor(245, 247, 250)
    doc.roundedRect(20, yPos, 170, 80, 3, 3, 'F')

    doc.setTextColor(66, 133, 244)
    doc.setFontSize(16)
    doc.text(`${network.toUpperCase()} Network`, 30, yPos + 20)

    doc.setTextColor(80, 80, 80)
    doc.setFontSize(12)
    doc.text([
      `TPS: ${formatTPS(metrics.averageTPS)}`,
      `Block Time: ${formatBlockTime(metrics.averageBlockTime)}`,
      `Gas Cost: ${formatGasPrice(metrics.averageGasCost)}`,
      `Success Rate: ${formatPercent(metrics.successRate)}`,
    ], 30, yPos + 35)

    yPos += 100
  })

  // Report info
  doc.setTextColor(128, 128, 128)
  doc.setFontSize(10)
  doc.text([
    `Report Generated: ${new Date(data.timestamp).toLocaleString()}`,
    `Data Collection Period: ${formatTimeRange(data)}`,
  ], 105, 270, { align: 'center' })
}

function generateMetricsSummary(doc: jsPDF, data: StoredData) {
  addPageHeader(doc, 'Network Metrics Summary')

  const metrics = data.summaries
  const tableData = [
    ['Metric', 'L2', 'Linea', 'Difference'],
    ['Transaction Throughput', 
      formatTPS(metrics.l2.averageTPS),
      formatTPS(metrics.linea.averageTPS),
      formatDifference(metrics.l2.averageTPS, metrics.linea.averageTPS)
    ],
    ['Block Time',
      formatBlockTime(metrics.l2.averageBlockTime),
      formatBlockTime(metrics.linea.averageBlockTime),
      formatDifference(metrics.l2.averageBlockTime, metrics.linea.averageBlockTime)
    ],
    ['Gas Cost',
      formatGasPrice(metrics.l2.averageGasCost),
      formatGasPrice(metrics.linea.averageGasCost),
      formatDifference(metrics.l2.averageGasCost, metrics.linea.averageGasCost)
    ],
    ['Network Latency',
      formatLatency(metrics.l2.averageLatency),
      formatLatency(metrics.linea.averageLatency),
      formatDifference(metrics.l2.averageLatency, metrics.linea.averageLatency)
    ],
    ['Success Rate',
      formatPercent(metrics.l2.successRate),
      formatPercent(metrics.linea.successRate),
      formatDifference(metrics.l2.successRate, metrics.linea.successRate)
    ],
  ]

  doc.autoTable({
    startY: 50,
    head: [tableData[0]],
    body: tableData.slice(1),
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
      3: { halign: 'center' },
    },
  })
}

function generateStressTestResults(doc: jsPDF, data: StoredData & { stressTests: NonNullable<StoredData['stressTests']> }) {
  addPageHeader(doc, 'Stress Test Results')

  let yPos = 50
  data.stressTests.slice(-5).forEach((test, index) => {
    doc.setFontSize(12)
    doc.setTextColor(66, 133, 244)
    doc.text(`Test ${index + 1}: ${new Date(test.startTime).toLocaleString()}`, 20, yPos)
    
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text(`Configuration: ${test.config.transactionType} @ ${test.config.tps} TPS`, 20, yPos + 10)

    const tableData = [
      ['Metric', 'L2', 'Linea'],
      ['Average TPS', 
        formatTPS(test.results.l2?.avgTps || 0),
        formatTPS(test.results.linea?.avgTps || 0)
      ],
      ['Success Rate',
        formatPercent(test.results.l2?.successRate || 0),
        formatPercent(test.results.linea?.successRate || 0)
      ],
      ['Average Block Time',
        formatBlockTime(test.results.l2?.avgBlockTime || 0),
        formatBlockTime(test.results.linea?.avgBlockTime || 0)
      ],
    ]

    doc.autoTable({
      startY: yPos + 15,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'striped',
      styles: { fontSize: 9 },
      margin: { left: 20 },
    })

    yPos = (doc as any).lastAutoTable.finalY + 20

    if (yPos > 250) {
      doc.addPage()
      addPageHeader(doc, 'Stress Test Results (Continued)')
      yPos = 50
    }
  })
}

function addPageHeader(doc: jsPDF, title: string) {
  doc.setFillColor(66, 133, 244)
  doc.rect(0, 0, 210, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text(title, 105, 20, { align: 'center' })
}

function addPageNumber(doc: jsPDF, currentPage: number, pageCount: number) {
  doc.setDrawColor(200, 200, 200)
  doc.line(20, 280, 190, 280)
  doc.setFontSize(10)
  doc.setTextColor(128, 128, 128)
  doc.text(`Page ${currentPage} of ${pageCount}`, 105, 288, { align: 'center' })
}

function formatTimeRange(data: StoredData): string {
  const endTime = new Date(data.timestamp)
  const startTime = new Date(endTime.getTime() - 15 * 60 * 1000) // 15 minutes
  return `${startTime.toLocaleString()} - ${endTime.toLocaleString()}`
}

function formatDifference(value1: number, value2: number): string {
  if (!value2) return '-'
  const diff = ((value1 - value2) / value2) * 100
  const arrow = diff > 0 ? '↑' : '↓'
  return `${Math.abs(diff).toFixed(1)}% ${arrow}`
}