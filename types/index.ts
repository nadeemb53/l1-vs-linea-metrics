export interface MetricData {
  timestamp: Date
  value: number
  network: string
}

export interface NetworkData {
  tps: MetricData[]
  blockTime: MetricData[]
  gasCost: MetricData[]
  networkLatency: MetricData[]
  successRate: MetricData[]
  totalTransactions: MetricData[]
  proofGenTime: MetricData[]
  stateSyncLatency: MetricData[]
  reorgFrequency: MetricData[]
  blockPropagation: MetricData[]
  nodeResponseTime: MetricData[]
}

export interface ExtendedMetrics {
  tps: number
  blockTime: number
  gasPrice: number
  latency: number
  successRate: number
  totalTransactions: number
  proofGenTime: number
  stateSyncLatency: number
  reorgFrequency: number
  blockPropagation: number
  nodeResponseTime: number
}

export interface StressTestConfig {
  duration: number
  tps: number
  transactionType: 'transfer' | 'erc20' | 'nft' | 'complex'
  networks: string[]
}

export interface TransactionInfo {
  hash: string
  timestamp: number
  status: 'pending' | 'success' | 'failed'
  gasUsed?: bigint
  blockTime?: number
}

export interface NetworkMetrics {
  avgTps: number
  successRate: number
  avgBlockTime: number
  avgGasUsed: number
  transactions: TransactionInfo[]
}