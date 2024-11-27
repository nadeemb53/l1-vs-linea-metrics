'use client'

import { useState, useEffect } from 'react'
import { BlockchainMetrics } from '@/lib/blockchain'
import { NetworkData } from '@/types'
import { MetricsCard } from '@/app/components/MetricsCard'
import {
  TPSChart,
  GasChart,
  BlockTimeChart,
  NetworkLatencyChart,
  SuccessRateChart,
  NodeMetricsChart,
} from './charts'
import { ethers } from 'ethers'
import {
  formatTPS,
  formatBlockTime,
  formatGasPrice,
  formatLatency,
  formatPercent,
} from '@/lib/utils'
import { storeMetricsData, getStoredMetricsData } from '@/lib/metricsStorage'

const metrics = new BlockchainMetrics()

const initialData: NetworkData = {
  tps: [],
  blockTime: [],
  gasCost: [],
  networkLatency: [],
  successRate: [],
  totalTransactions: [],
  proofGenTime: [],
  stateSyncLatency: [],
  reorgFrequency: [],
  blockPropagation: [],
  nodeResponseTime: []
}

export function Dashboard() {
  const [data, setData] = useState<NetworkData>(initialData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load stored data on mount
  useEffect(() => {
    const storedData = getStoredMetricsData()
    if (storedData) {
      setData(storedData.metrics)
    }
    setIsLoading(false)
  }, [])

  // Fetch new data periodically
  useEffect(() => {
    const fetchData = async () => {
      try {
        const networks = ['l2', 'linea'] as const
        const timestamp = new Date()
        const newData = { ...data }

        await Promise.all(networks.map(async (network) => {
          const [baseMetrics, extendedMetrics] = await Promise.all([
            metrics.getBaseMetrics(network),
            metrics.getExtendedMetrics(network)
          ])

          // Update metrics
          Object.entries({ ...baseMetrics, ...extendedMetrics }).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              newData[key as keyof NetworkData] = [
                ...newData[key as keyof NetworkData].filter(item => 
                  new Date(item.timestamp).getTime() > timestamp.getTime() - 15 * 60 * 1000 // Keep last 15 minutes
                ),
                { timestamp, value, network }
              ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            }
          })
        }))

        setData(newData)
        storeMetricsData(newData)
        setError(null)
      } catch (err) {
        console.error('Error fetching metrics:', err)
        setError('Failed to fetch metrics data')
      }
    }

    if (!isLoading) {
      fetchData()
      const interval = setInterval(fetchData, 5000)
      return () => clearInterval(interval)
    }
  }, [data, isLoading])

  const getLatestValues = (metricKey: keyof NetworkData) => {
    const metrics = data[metricKey]
    if (!metrics.length) return { l2: 0, linea: 0 }
    
    const sorted = [...metrics].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    return {
      l2: sorted.find(d => d.network === 'l2')?.value || 0,
      linea: sorted.find(d => d.network === 'linea')?.value || 0
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading metrics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
      <h1 className="text-2xl font-bold mb-6 px-2">Network Performance Dashboard</h1>

      {/* Performance Metrics Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4 px-2">Performance Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricsCard
            title="Transaction Throughput"
            {...getLatestValues('tps')}
            formatValue={formatTPS}
            className="min-h-[160px]"
          />
          <MetricsCard
            title="Block Time"
            {...getLatestValues('blockTime')}
            formatValue={formatBlockTime}
            inverted={true}
            className="min-h-[160px]"
          />
          <MetricsCard
            title="Gas Cost"
            {...getLatestValues('gasCost')}
            formatValue={(v) => formatGasPrice(Number(ethers.formatUnits(v, 'gwei')))}
            inverted={true}
            className="min-h-[160px]"
          />
          <MetricsCard
            title="Network Latency"
            {...getLatestValues('networkLatency')}
            formatValue={formatLatency}
            inverted={true}
            className="min-h-[160px]"
          />
        </div>
      </section>

      {/* Reliability Metrics Section
      <section>
        <h2 className="text-lg font-semibold mb-4 px-2">Reliability Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2">
          <MetricsCard
            title="Success Rate"
            {...getLatestValues('successRate')}
            formatValue={formatPercent}
            className="min-h-[160px]"
          />
          <MetricsCard
            title="State Sync Latency"
            {...getLatestValues('stateSyncLatency')}
            formatValue={formatLatency}
            inverted={true}
            className="min-h-[160px]"
          />
        </div>
      </section>

      {/* Network Health Section */}
      {/* <section>
        <h2 className="text-lg font-semibold mb-4 px-2">Network Health</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2">
          <MetricsCard
            title="Block Propagation"
            {...getLatestValues('blockPropagation')}
            formatValue={formatLatency}
            inverted={true}
            className="min-h-[160px]"
          />
          <MetricsCard
            title="Node Response Time"
            {...getLatestValues('nodeResponseTime')}
            formatValue={formatLatency}
            inverted={true}
            className="min-h-[160px]"
          />
        </div>
      </section> */}

      {/* Charts Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4 px-2">Performance Charts</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Transaction Performance</h3>
              <div className="w-full h-[300px] overflow-x-auto">
                <TPSChart data={data.tps} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Gas Costs</h3>
              <div className="w-full h-[300px] overflow-x-auto">
                <GasChart data={data.gasCost} />
              </div>
            </div>
          </div>
          
          {/* <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Success Rate</h3>
              <div className="w-full h-[300px] overflow-x-auto">
                <SuccessRateChart data={data.successRate} />
              </div>
            </div>
          </div> */}
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Block Time</h3>
              <div className="w-full h-[300px] overflow-x-auto">
                <BlockTimeChart data={data.blockTime} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Network Latency</h3>
              <div className="w-full h-[300px] overflow-x-auto">
                <NetworkLatencyChart data={data.networkLatency} />
              </div>
            </div>
          </div>

          {/* <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Proof Generation Time</h3>
              <div className="w-full h-[300px] overflow-x-auto">
                <ProofTimeChart data={data.proofGenTime} />
              </div>
            </div>
          </div> */}

          {/* <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Node Metrics</h3>
              <div className="w-full h-[300px] overflow-x-auto">
                <NodeMetricsChart 
                  stateSyncData={data.stateSyncLatency}
                  blockPropData={data.blockPropagation}
                  nodeRespData={data.nodeResponseTime}
                />
              </div>
            </div>
          </div> */}

          {/* <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Network Health</h3>
              <div className="w-full h-[300px] overflow-x-auto">
                <ReorgFrequencyChart data={data.reorgFrequency} />
              </div>
            </div>
          </div> */}
        </div>
      </section>
    </div>
  )
}