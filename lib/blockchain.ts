// lib/blockchain.ts
import { ethers } from 'ethers'

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
    rpc: 'https://rpc.sepolia.linea.build',
    contracts: {
      erc20: '',
      nft: '',
      complex: ''
    }
  },
}

export class BlockchainMetrics {
  private providers: Record<string, ethers.Provider>

  constructor() {
    this.providers = {
      l2: new ethers.JsonRpcProvider(networks.l2.rpc),
      linea: new ethers.JsonRpcProvider(networks.linea.rpc),
    }
  }

  async getBaseMetrics(network: string) {
    try {
      console.log(`\n[${network}] Fetching base metrics...`)
      
      const latestBlock = await this.providers[network].getBlock('latest')
      if (!latestBlock) {
        throw new Error('Failed to fetch latest block')
      }
      console.log(`[${network}] Latest block:`, latestBlock.number)

      const [tps, blockTime, gasCost, networkLatency] = await Promise.all([
        this.getTPS(network, latestBlock),
        this.getBlockTime(network, latestBlock),
        this.getGasCosts(network),
        this.getNetworkLatency(network)
      ])

      console.log(`[${network}] Metrics calculated:`, {
        tps,
        blockTime,
        gasCost,
        networkLatency
      })

      return { tps, blockTime, gasCost, networkLatency }
    } catch (error) {
      console.error(`[${network}] Error fetching base metrics:`, error)
      return { tps: 0, blockTime: 0, gasCost: 0, networkLatency: 0 }
    }
  }

  async getTPS(network: string, latestBlock?: ethers.Block): Promise<number> {
    try {
      const block = latestBlock || await this.providers[network].getBlock('latest')
      if (!block) return 0

      // Get the previous block to calculate actual time difference
      const prevBlock = await this.providers[network].getBlock(block.number - 1)
      if (!prevBlock) return 0

      const txCount = block.transactions.length
      const timeSpan = block.timestamp - prevBlock.timestamp

      const tps = timeSpan > 0 ? txCount / timeSpan : 0
      console.log(`[${network}] TPS calculation:`, {
        blockNumber: block.number,
        transactions: txCount,
        timeSpan,
        tps
      })

      return tps
    } catch (error) {
      console.error(`[${network}] Error calculating TPS:`, error)
      return 0
    }
  }

  async getBlockTime(network: string, latestBlock?: ethers.Block): Promise<number> {
    try {
      const block = latestBlock || await this.providers[network].getBlock('latest')
      if (!block) return 0

      // Get the previous block for a simple time difference
      const prevBlock = await this.providers[network].getBlock(block.number - 1)
      if (!prevBlock) return 0

      // Calculate time difference directly between consecutive blocks
      const blockTime = block.timestamp - prevBlock.timestamp
      
      console.log(`[${network}] Block time calculation:`, {
        blockNumber: block.number,
        currentTimestamp: block.timestamp,
        prevTimestamp: prevBlock.timestamp,
        blockTime
      })

      return blockTime
    } catch (error) {
      console.error(`[${network}] Error calculating block time:`, error)
      return 0
    }
  }

  async getGasCosts(network: string): Promise<number> {
    try {
      const feeData = await this.providers[network].getFeeData()
      const gasPrice = feeData.gasPrice ? Number(ethers.formatUnits(feeData.gasPrice, 'gwei')) : 0
      
      console.log(`[${network}] Gas price:`, {
        gweiPrice: gasPrice,
        rawPrice: feeData.gasPrice?.toString()
      })
      
      return gasPrice
    } catch (error) {
      console.error(`[${network}] Error fetching gas costs:`, error)
      return 0
    }
  }

  async getNetworkLatency(network: string): Promise<number> {
    try {
      const start = Date.now()
      const blockNumber = await this.providers[network].getBlockNumber()
      const latency = Date.now() - start

      console.log(`[${network}] Network latency:`, {
        blockNumber,
        latencyMs: latency
      })

      return latency
    } catch (error) {
      console.error(`[${network}] Error measuring network latency:`, error)
      return 0
    }
  }
}