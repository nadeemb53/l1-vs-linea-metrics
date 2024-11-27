// lib/metricsStorage.ts
import { NetworkData } from '@/types'

const STORAGE_KEY = 'network_metrics_data'

export interface StressTestResult {
  startTime: string
  endTime: string
  config: {
    duration: number
    tps: number
    transactionType: string
  }
  results: {
    [network: string]: {
      avgTps: number
      avgBlockTime: number
      avgGasUsed: number
      successRate: number
      transactions: {
        hash: string
        timestamp: number
        status: 'pending' | 'success' | 'failed'
        gasUsed?: bigint
        blockTime?: number
      }[]
    }
  }
}

export interface StoredData {
  timestamp: string
  metrics: NetworkData
  summaries: {
    [network: string]: {
      averageTPS: number
      averageBlockTime: number
      averageGasCost: number
      averageLatency: number
      successRate: number
    }
  }
  stressTests?: StressTestResult[]
}

export function storeMetricsData(data: NetworkData) {
  try {
    // Calculate summaries
    const networks = ['l2', 'linea'] as const
    const summaries = networks.reduce((acc, network) => {
      const networkData = Object.entries(data).reduce((metrics, [key, values]) => {
        const networkValues = values
          .filter((v: { network: string; value: number }) => v.network === network)
          .map((v: { value: number }) => v.value)
        
        if (networkValues.length) {
          metrics[key] = networkValues.reduce((a: number, b: number) => a + b, 0) / networkValues.length
        }
        return metrics
      }, {} as Record<string, number>)

      acc[network] = {
        averageTPS: networkData.tps || 0,
        averageBlockTime: networkData.blockTime || 0,
        averageGasCost: networkData.gasCost || 0,
        averageLatency: networkData.networkLatency || 0,
        successRate: networkData.successRate || 0
      }
      return acc
    }, {} as StoredData['summaries'])

    // Get existing stored data to preserve stress test results
    const existingData = getStoredMetricsData()
    
    const storedData: StoredData = {
      timestamp: new Date().toISOString(),
      metrics: data,
      summaries,
      // Preserve existing stress test results if they exist
      stressTests: existingData?.stressTests || []
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData))
  } catch (error) {
    console.error('Error storing metrics data:', error)
  }
}

export function storeStressTestResult(
  config: StressTestResult['config'],
  results: StressTestResult['results']
) {
  try {
    const existingData = getStoredMetricsData() || {
      timestamp: new Date().toISOString(),
      metrics: {},
      summaries: {},
      stressTests: []
    }

    const stressTest: StressTestResult = {
      startTime: new Date(Date.now() - config.duration * 1000).toISOString(),
      endTime: new Date().toISOString(),
      config,
      results
    }

    existingData.stressTests = [
      ...(existingData.stressTests || []),
      stressTest
    ]

    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData))
    return existingData
  } catch (error) {
    console.error('Error storing stress test result:', error)
    throw error
  }
}

export function getStoredMetricsData(): StoredData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null

    const parsed = JSON.parse(data) as StoredData
    const timestamp = new Date(parsed.timestamp)
    const now = new Date()

    // Data older than 24 hours is considered stale
    if (now.getTime() - timestamp.getTime() > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsed
  } catch (error) {
    console.error('Error loading metrics data:', error)
    return null
  }
}

export function clearStoredMetrics() {
  localStorage.removeItem(STORAGE_KEY)
}