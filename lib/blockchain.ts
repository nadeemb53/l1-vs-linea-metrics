// lib/blockchain.ts
import { ethers } from 'ethers'
import { ExtendedMetrics } from '@/types'

export const networks = {
  l2: {
    name: 'Custom L2',
    rpc: process.env.L2_RPC || 'https://rpc.blast.io',
    contracts: {
      erc20: '',
      nft: '',
      complex: ''
    }
  },
  linea: {
    name: 'Linea',
    rpc: 'https://rpc.linea.build',
    contracts: {
      erc20: '',
      nft: '',
      complex: ''
    }
  },
}

export class BlockchainMetrics {
  private providers: Record<string, ethers.Provider>
  private blockCache: Map<string, { block: ethers.Block, timestamp: number }>
  private requestCache: Map<string, { promise: Promise<any>, timestamp: number }>
  private lastRequestTime: Record<string, number> = {}

  constructor() {
    this.providers = {
      l2: new ethers.JsonRpcProvider(networks.l2.rpc),
      linea: new ethers.JsonRpcProvider(networks.linea.rpc),
    }
    this.blockCache = new Map()
    this.requestCache = new Map()
  }

  private async throttleRequest(network: string): Promise<void> {
    const now = Date.now()
    const lastRequest = this.lastRequestTime[network] || 0
    const delay = Math.max(0, 200 - (now - lastRequest)) // Minimum 200ms between requests
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    this.lastRequestTime[network] = Date.now()
  }

  private async cachedRequest<T>(
    network: string,
    key: string,
    request: () => Promise<T>,
    ttl: number = 1000 // Cache TTL in ms
  ): Promise<T> {
    const cacheKey = `${network}-${key}`
    const cached = this.requestCache.get(cacheKey)
    const now = Date.now()

    if (cached && now - cached.timestamp < ttl) {
      return cached.promise
    }

    await this.throttleRequest(network)
    const promise = request().catch(error => {
      this.requestCache.delete(cacheKey)
      throw error
    })

    this.requestCache.set(cacheKey, { promise, timestamp: now })
    return promise
  }

  async getBaseMetrics(network: string) {
    try {
      // Get latest block once and reuse
      const latestBlock = await this.cachedRequest(
        network,
        'latest-block',
        () => this.providers[network].getBlock('latest')
      )

      if (!latestBlock) {
        throw new Error('Failed to fetch latest block')
      }

      const [tps, blockTime, gasCost, networkLatency] = await Promise.all([
        this.getTPS(network, latestBlock),
        this.getBlockTime(network, latestBlock),
        this.getGasCosts(network),
        this.getNetworkLatency(network)
      ])

      return { tps, blockTime, gasCost, networkLatency }
    } catch (error) {
      console.error(`Error fetching base metrics for ${network}:`, error)
      return { tps: 0, blockTime: 0, gasCost: 0, networkLatency: 0 }
    }
  }

  async getTPS(network: string, latestBlock?: ethers.Block): Promise<number> {
    try {
      const block = latestBlock || await this.cachedRequest(
        network,
        'latest-block',
        () => this.providers[network].getBlock('latest')
      )

      if (!block) return 0

      const prevBlock = await this.cachedRequest(
        network,
        `block-${block.number - 10}`,
        () => this.providers[network].getBlock(block!.number - 10)
      )

      if (!prevBlock) return 0

      const txCount = block.number - prevBlock.number
      const timeSpan = block.timestamp - prevBlock.timestamp

      return timeSpan > 0 ? txCount / timeSpan : 0
    } catch (error) {
      console.error(`Error calculating TPS for ${network}:`, error)
      return 0
    }
  }

  async getBlockTime(network: string, latestBlock?: ethers.Block): Promise<number> {
    try {
      const block = latestBlock || await this.cachedRequest(
        network,
        'latest-block',
        () => this.providers[network].getBlock('latest')
      )

      if (!block) return 0

      const prevBlock = await this.cachedRequest(
        network,
        `block-${block.number - 1}`,
        () => this.providers[network].getBlock(block!.number - 1)
      )

      return prevBlock ? block.timestamp - prevBlock.timestamp : 0
    } catch (error) {
      console.error(`Error calculating block time for ${network}:`, error)
      return 0
    }
  }

  async getGasCosts(network: string): Promise<number> {
    try {
      const feeData = await this.cachedRequest(
        network,
        'gas-price',
        () => this.providers[network].getFeeData()
      )
      return Number(feeData.gasPrice) || 0
    } catch (error) {
      console.error(`Error fetching gas costs for ${network}:`, error)
      return 0
    }
  }

  async getExtendedMetrics(network: string): Promise<Partial<ExtendedMetrics>> {
    try {
      const [
        successRate,
        totalTransactions,
        proofGenTime,
        stateSyncLatency,
        reorgFrequency,
      ] = await Promise.all([
        this.getSuccessRate(network),
        this.getTotalTransactions(network),
        this.getStateSyncLatency(network),
        this.getBlockPropagation(network),
        this.getNodeResponseTime(network)
      ])

      return {
        successRate,
        totalTransactions,
        proofGenTime,
        stateSyncLatency,
        reorgFrequency,
      }
    } catch (error) {
      console.error(`Error fetching extended metrics for ${network}:`, error)
      return {
        successRate: 0,
        totalTransactions: 0,
        proofGenTime: 0,
        stateSyncLatency: 0,
        reorgFrequency: 0,
        blockPropagation: 0,
        nodeResponseTime: 0
      }
    }
  }

  async getSuccessRate(network: string): Promise<number> {
    try {
      const latestBlock = await this.cachedRequest(
        network,
        'latest-block',
        () => this.providers[network].getBlock('latest')
      )

      if (!latestBlock) return 0

      // Get last 5 blocks instead of 10 to reduce load
      const blocks = await Promise.all(
        Array.from({ length: 5 }, (_, i) => 
          this.cachedRequest(
            network,
            `block-${latestBlock.number - i}`,
            () => this.providers[network].getBlock(latestBlock.number - i, true)
          )
        )
      )

      let successfulTx = 0
      let totalTx = 0

      blocks.forEach(block => {
        if (!block?.transactions) return
        totalTx += block.transactions.length
        successfulTx += block.transactions.length
      })

      return totalTx === 0 ? 100 : (successfulTx / totalTx) * 100
    } catch (error) {
      console.error(`Error calculating success rate for ${network}:`, error)
      return 0
    }
  }

  async getTotalTransactions(network: string): Promise<number> {
    try {
      const latestBlock = await this.cachedRequest(
        network,
        'latest-block',
        () => this.providers[network].getBlock('latest')
      )

      if (!latestBlock) return 0

      const prevBlock = await this.cachedRequest(
        network,
        `block-${latestBlock.number - 100}`, // Reduced from 1000 to 100 to prevent rate limiting
        () => this.providers[network].getBlock(latestBlock.number - 100)
      )

      return prevBlock ? latestBlock.number - prevBlock.number : 0
    } catch (error) {
      console.error(`Error fetching total transactions for ${network}:`, error)
      return 0
    }
  }

  async getNetworkLatency(network: string): Promise<number> {
    try {
      const start = Date.now()
      await this.cachedRequest(
        network,
        'network-latency',
        () => this.providers[network].getBlockNumber()
      )
      return Date.now() - start
    } catch (error) {
      console.error(`Error measuring network latency for ${network}:`, error)
      return 0
    }
  }

  async getStateSyncLatency(network: string): Promise<number> {
    try {
      const start = Date.now()
      const block1 = await this.providers[network].getBlockNumber()
      await new Promise(resolve => setTimeout(resolve, 100))
      const block2 = await this.providers[network].getBlockNumber()
      return block2 > block1 ? Date.now() - start : 1000
    } catch (error) {
      return 1000
    }
  }

  async getBlockPropagation(network: string): Promise<number> {
    try {
      const start = Date.now()
      const blockNumber = await this.providers[network].getBlockNumber()
      const block = await this.providers[network].getBlock(blockNumber)
      return block ? Math.max(0, Date.now() - (block.timestamp * 1000)) : 1000
    } catch (error) {
      return 1000
    }
  }

  async getNodeResponseTime(network: string): Promise<number> {
    return this.getNetworkLatency(network)
  }

  private cleanCaches() {
    const now = Date.now()
    
    // Clean block cache
    Array.from(this.blockCache.entries()).forEach(([key, value]) => {
      if (now - value.timestamp > 3600000) {
        this.blockCache.delete(key)
      }
    })

    // Clean request cache
    Array.from(this.requestCache.entries()).forEach(([key, value]) => {
      if (now - value.timestamp > 5000) {
        this.requestCache.delete(key)
      }
    })
  }
}