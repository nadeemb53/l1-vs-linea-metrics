// app/stress-test/page.tsx
'use client'

import { useState } from 'react'
import { Card } from '@/app/components/ui/card'
import { StressTestForm } from './StressTestForm'
import { StressTestProgress } from './StressTestProgress'
import { StressTestResults } from './StressTestResults'
import type { NetworkMetrics, StressTestConfig } from './../../types'

export default function StressTestPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentMetrics, setCurrentMetrics] = useState<Record<string, NetworkMetrics>>()
  const [finalResults, setFinalResults] = useState<Record<string, NetworkMetrics>>()

  const handleStartTest = async (config: StressTestConfig) => {
    setIsRunning(true)
    setProgress(0)
    setFinalResults(undefined)
    
    try {
      const response = await fetch('/api/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error('Stress test failed')
      }

      // Setup SSE or polling for progress updates
      const pollInterval = setInterval(async () => {
        const metricsResponse = await fetch('/api/stress-test/metrics')
        const metrics = await metricsResponse.json()
        
        if (metrics) {
          setCurrentMetrics(metrics)
          // Calculate overall progress based on elapsed time
          const elapsed = (Date.now() - metrics.startTime) / 1000
          const progress = Math.min((elapsed / config.duration) * 100, 100)
          setProgress(progress)

          if (progress >= 100) {
            clearInterval(pollInterval)
            const results = await response.json()
            setFinalResults(results)
          }
        }
      }, 1000)

    } catch (error) {
      console.error('Stress test failed:', error)
    } finally {
      setIsRunning(false)
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
              currentMetrics={currentMetrics} 
            />
          </Card>
        )}

        {finalResults && (
          <Card className="p-6 metrics-card lg:col-span-2">
            <StressTestResults results={finalResults} />
          </Card>
        )}
      </div>
    </div>
  )
}