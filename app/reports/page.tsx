// app/reports/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/app/components/ui/card'
import { formatDate, formatGasPrice, formatLatency, formatPercent, formatTPS } from '@/lib/utils'
import { getStoredMetricsData } from '@/lib/metricsStorage'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { NetworkData, StoredData } from '@/types'

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

  const prepareChartData = (metricKey: keyof NetworkData) => {
    if (!reportData.metrics[metricKey]) return []
    
    return reportData.metrics[metricKey].map(dataPoint => ({
      timestamp: new Date(dataPoint.timestamp).getTime(),
      l2: dataPoint.network === 'l2' ? dataPoint.value : null,
      linea: dataPoint.network === 'linea' ? dataPoint.value : null,
    }))
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

      {/* Network Summary */}
      <Card className="p-6 metrics-card">
        <h2 className="text-xl font-semibold mb-4">Network Performance Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['l2', 'linea'].map(network => (
            <div key={network} className="space-y-4">
              <h3 className="text-lg font-medium text-gradient">
                {network.toUpperCase()}
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">TPS</span>
                  <span className="font-medium">
                    {formatTPS(reportData.summaries[network].averageTPS)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Block Time</span>
                  <span className="font-medium">
                    {formatLatency(reportData.summaries[network].averageBlockTime)}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gas Cost</span>
                  <span className="font-medium">
                    {formatGasPrice(reportData.summaries[network].averageGasCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Network Latency</span>
                  <span className="font-medium">
                    {formatLatency(reportData.summaries[network].averageLatency)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-medium">
                    {formatPercent(reportData.summaries[network].successRate)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Performance Charts */}
      <Card className="p-6 metrics-card">
        <h2 className="text-xl font-semibold mb-4">Performance Trends</h2>
        
        <div className="space-y-6">
          {/* TPS Chart */}
          <div>
            <h3 className="text-lg font-medium mb-4">Transactions Per Second</h3>
            <LineChart width={800} height={300} data={prepareChartData('tps')}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()} 
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                formatter={(value: any) => [formatTPS(value), 'TPS']}
              />
              <Legend />
              <Line type="monotone" dataKey="l2" name="L2 TPS" stroke="#8884d8" />
              <Line type="monotone" dataKey="linea" name="Linea TPS" stroke="#82ca9d" />
            </LineChart>
          </div>

          {/* Gas Cost Chart */}
          <div>
            <h3 className="text-lg font-medium mb-4">Gas Costs</h3>
            <LineChart width={800} height={300} data={prepareChartData('gasCost')}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()} 
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                formatter={(value: any) => [formatGasPrice(value), 'Gwei']}
              />
              <Legend />
              <Line type="monotone" dataKey="l2" name="L2 Gas" stroke="#8884d8" />
              <Line type="monotone" dataKey="linea" name="Linea Gas" stroke="#82ca9d" />
            </LineChart>
          </div>

          {/* Success Rate Chart */}
          <div>
            <h3 className="text-lg font-medium mb-4">Success Rate</h3>
            <LineChart width={800} height={300} data={prepareChartData('successRate')}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()} 
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                formatter={(value: any) => [`${formatPercent(value)}%`, 'Success Rate']}
              />
              <Legend />
              <Line type="monotone" dataKey="l2" name="L2 Success Rate" stroke="#8884d8" />
              <Line type="monotone" dataKey="linea" name="Linea Success Rate" stroke="#82ca9d" />
            </LineChart>
          </div>
        </div>
      </Card>

      {/* Optional Stress Test Results */}
      {(() => {
        if (!reportData.stressTests?.length) return null;
        const stressTests = reportData.stressTests;
        return (
          <Card className="p-6 metrics-card">
            <h2 className="text-xl font-semibold mb-4">Recent Stress Tests</h2>
            <div className="space-y-4">
              {stressTests.slice(-3).reverse().map((test, index) => (
                <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">
                        Stress Test {stressTests.length - index}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Date(test.endTime).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">
                        {test.config.transactionType} @ {test.config.tps} TPS
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {Object.entries(test.results).map(([network, results]) => (
                      <div key={network} className="text-sm">
                        <div className="font-medium">{network.toUpperCase()}</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>TPS: {formatTPS(results.avgTps)}</div>
                          <div>Success: {formatPercent(results.successRate)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}
    </div>
  )
}