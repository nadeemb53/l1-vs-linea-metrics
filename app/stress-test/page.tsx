'use client'

import { useState } from 'react'
import { Card } from '@/app/components/ui/card'
import { StressTestForm } from './StressTestForm'
import { StressTestProgress } from './StressTestProgress'
import { StressTestResults } from './StressTestResults'
import type { NetworkMetrics, StressTestConfig } from '@/types'

export default function StressTestPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<Record<string, NetworkMetrics>>()

  const handleStartTest = async (config: StressTestConfig) => {
    setIsRunning(true)
    setProgress(0)
    setResults(undefined)
    
    try {
      // Start progress timer based on test duration
      const startTime = Date.now()
      const progressInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000
        const currentProgress = Math.min((elapsed / config.duration) * 100, 100)
        setProgress(currentProgress)
        
        if (currentProgress >= 100) {
          clearInterval(progressInterval)
        }
      }, 1000)

      // Run the stress test
      const response = await fetch('/api/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error('Stress test failed')
      }

      clearInterval(progressInterval)
      setProgress(100)
      
      const results = await response.json()
      setResults(results)
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
              isRunning={isRunning}
              selectedNetworks={results ? Object.keys(results) : []}
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