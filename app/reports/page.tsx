// app/reports/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/app/components/ui/card'
import { formatDate, formatNumber, formatGasPrice, formatLatency, formatPercent } from '@/lib/utils'
import { getStoredMetricsData, type StoredData } from '@/lib/metricsStorage'

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<StoredData | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  useEffect(() => {
    const data = getStoredMetricsData()
    setReportData(data)
    setLoading(false)
  }, [])

  const generatePDF = async () => {
    if (!reportData) return

    setGeneratingPdf(true)
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      })
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `network-report-${formatDate(new Date())}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
    } finally {
      setGeneratingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h1 className="text-2xl font-bold mb-4">Network Reports</h1>
          <p className="text-yellow-700">No metrics data available. Please collect some data first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gradient">Network Reports</h1>
        <button
          onClick={generatePDF}
          disabled={generatingPdf}
          className="py-2 px-4 rounded-md text-white font-medium bg-gradient-to-r 
                     from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600
                     transition-all duration-300 disabled:opacity-50"
        >
          {generatingPdf ? 'Generating PDF...' : 'Download PDF Report'}
        </button>
      </div>

      <Card className="p-6 metrics-card">
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold">
              Report Generated: {formatDate(new Date(reportData.timestamp))}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Data collected over the last {
                Math.round((Date.now() - new Date(reportData.timestamp).getTime()) / 60000)
              } minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(reportData.summaries).map(([network, metrics]) => (
              <div key={network} className="space-y-4">
                <h3 className="text-lg font-medium text-gradient">
                  {network.toUpperCase()} Metrics
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average TPS</span>
                    <span className="font-medium">{formatNumber(metrics.averageTPS)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Block Time</span>
                    <span className="font-medium">{formatLatency(metrics.averageBlockTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Gas Cost</span>
                    <span className="font-medium">{formatGasPrice(metrics.averageGasCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Latency</span>
                    <span className="font-medium">{formatLatency(metrics.averageLatency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate</span>
                    <span className="font-medium">{formatPercent(metrics.successRate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}