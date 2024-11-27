'use client'

import { useState } from 'react'
import { Card } from '@/app/components/ui/card'
import { StressTestForm } from './StressTestForm'
import { StressTestProgress } from './StressTestProgress'
import { StressTestResults } from './StressTestResults'
import type { NetworkMetrics, StressTestConfig } from '@/types'
import { storeStressTestResult } from '@/lib/metricsStorage'

export default function StressTestPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<Record<string, NetworkMetrics>>()
  const [transactions, setTransactions] = useState<{
    network: string
    sent: number
    pending: number
    confirmed: number
    failed: number
    latestBlock?: number
  }[]>([])
  const [txLogs, setTxLogs] = useState<{
    hash: string
    network: string
    status: 'pending' | 'success' | 'failed'
    blockNumber?: number
    timestamp: number
  }[]>([])

  const handleStartTest = async (config: StressTestConfig) => {
    setIsRunning(true)
    setProgress(0)
    setResults(undefined)
    setTransactions([])
    setTxLogs([])
    
    let eventSource: EventSource | undefined;
    
    const setupEventSource = () => {
      eventSource = new EventSource('/api/stress-test/status') as EventSource;
      
      eventSource.onopen = () => {
        console.log('SSE connection opened')
      }
      
      eventSource.onerror = (error) => {
        console.error('SSE error:', error)
        if (eventSource) {
          eventSource.close()
          setTimeout(setupEventSource, 1000)
        }
      }
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('SSE message received:', data)

          if (data.type === 'keepalive' || data.type === 'connected') {
            return
          }

          if (data.type === 'transactions' && data.transactions?.[0]) {
            console.log('Updating transactions:', data.transactions)
            setTransactions(data.transactions)
            if (typeof data.transactions[0].progress === 'number') {
              console.log('Setting progress:', data.transactions[0].progress)
              setProgress(data.transactions[0].progress)
            }
          } else if (data.type === 'txLog' && data.tx) {
            console.log('New transaction log:', data.tx)
            setTxLogs(prev => [data.tx, ...prev].slice(0, 100))
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error)
        }
      }
    }

    try {
      setupEventSource()

      const response = await fetch('/api/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error('Stress test failed')
      }

      const results = await response.json()
      setResults(results)
      await storeStressTestResult({
        duration: config.duration,
        tps: config.tps,
        transactionType: config.transactionType,
        networks: config.networks
      }, results)
    } catch (error) {
      console.error('Stress test failed:', error)
    } finally {
      setIsRunning(false)
      if (eventSource) {
        eventSource.close()
      }
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gradient">Network Stress Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 metrics-card">
          <StressTestForm onStart={handleStartTest} disabled={isRunning} />
        </Card>

        {(isRunning || progress > 0) && (
          <Card className="p-6 metrics-card">
            <StressTestProgress 
              progress={progress}
              isRunning={isRunning}
              selectedNetworks={results ? Object.keys(results) : []}
              transactions={transactions}
              txLogs={txLogs}
            />
          </Card>
        )}

        {results && (
          <Card className="p-6 metrics-card lg:col-span-2">
            <StressTestResults results={results} />
          </Card>
        )}
      </div>
    </div>
  )
}