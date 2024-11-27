import { NetworkData } from '@/types'

const STORAGE_KEY = 'network_metrics_data'

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

    const storedData: StoredData = {
      timestamp: new Date().toISOString(),
      metrics: data,
      summaries
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData))
  } catch (error) {
    console.error('Error storing metrics data:', error)
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