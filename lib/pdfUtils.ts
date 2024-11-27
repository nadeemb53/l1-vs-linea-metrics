// lib/pdfUtils.ts
import { UserOptions } from 'jspdf-autotable'

// Add type augmentation for jsPDF
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => void
  }
}

export function formatMetricName(key: string): string {
  const nameMap: Record<string, string> = {
    averageTPS: 'Average TPS',
    peakTPS: 'Peak TPS',
    averageBlockTime: 'Block Time',
    averageGasCost: 'Gas Cost',
    averageLatency: 'Network Latency',
    successRate: 'Success Rate',
    totalTransactions: 'Total Transactions',
    proofGenerationTime: 'Proof Generation Time',
    stateSyncLatency: 'State Sync Latency',
    reorgFrequency: 'Reorg Frequency',
    blockPropagation: 'Block Propagation',
    nodeResponseTime: 'Node Response Time',
  }

  return nameMap[key] || key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

export function formatMetricValue(key: string, value: number): string {
  if (value === undefined || value === null) return '-'

  const formatters: Record<string, (val: number) => string> = {
    averageTPS: (val) => `${val.toFixed(2)} TPS`,
    peakTPS: (val) => `${val.toFixed(2)} TPS`,
    averageBlockTime: (val) => `${val.toFixed(2)}s`,
    averageGasCost: (val) => `${val.toFixed(2)} Gwei`,
    averageLatency: (val) => `${val.toFixed(2)}ms`,
    successRate: (val) => `${val.toFixed(2)}%`,
    totalTransactions: (val) => val.toLocaleString(),
    proofGenerationTime: (val) => `${val.toFixed(2)}ms`,
    stateSyncLatency: (val) => `${val.toFixed(2)}ms`,
    reorgFrequency: (val) => `${val.toFixed(4)} per hour`,
    blockPropagation: (val) => `${val.toFixed(2)}ms`,
    nodeResponseTime: (val) => `${val.toFixed(2)}ms`,
  }

  const formatter = formatters[key]
  if (formatter) {
    return formatter(value)
  }

  // Default formatting for unknown metrics
  if (Number.isInteger(value)) {
    return value.toLocaleString()
  }
  return value.toFixed(2)
}