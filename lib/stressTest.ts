import { ethers } from 'ethers'
import { networks } from './blockchain'
import {TransactionInfo, NetworkMetrics, StressTestConfig} from '@/types';

class NetworkStressTester {
  private currentNonce: number
  private pendingTxs: Map<number, TransactionInfo>
  private wallet: ethers.Wallet
  private metrics: NetworkMetrics

  constructor(wallet: ethers.Wallet) {
    this.wallet = wallet
    this.currentNonce = 0
    this.pendingTxs = new Map()
    this.metrics = {
      avgTps: 0,
      successRate: 0,
      avgBlockTime: 0,
      avgGasUsed: 0,
      transactions: []
    }
  }

  async initialize() {
    this.currentNonce = Number(await this.wallet.getNonce())
  }

  async sendTransaction(type: string): Promise<void> {
    const nonce = this.currentNonce++
    let tx: ethers.TransactionResponse

    try {
      tx = await this.generateTransaction(type, nonce)
      
      const txInfo: TransactionInfo = {
        hash: tx.hash,
        timestamp: Date.now(),
        status: 'pending'
      }
      
      this.pendingTxs.set(nonce, txInfo)
      this.metrics.transactions.push(txInfo)

      // Handle transaction confirmation asynchronously
      this.handleTransaction(tx, nonce).catch(console.error)
    } catch (error) {
      console.error(`Failed to send transaction with nonce ${nonce}:`, error)
      this.pendingTxs.delete(nonce)
    }
  }

  private async handleTransaction(
    tx: ethers.TransactionResponse,
    nonce: number
  ): Promise<void> {
    try {
      const receipt = await tx.wait()
      const txInfo = this.pendingTxs.get(nonce)
      
      if (txInfo) {
        txInfo.status = receipt?.status ? 'success' : 'failed'
        txInfo.gasUsed = receipt?.gasUsed
        txInfo.blockTime = (Date.now() - txInfo.timestamp) / 1000
      }
    } catch (error) {
      console.error(`Transaction failed for nonce ${nonce}:`, error)
      const txInfo = this.pendingTxs.get(nonce)
      if (txInfo) {
        txInfo.status = 'failed'
      }
    } finally {
      this.pendingTxs.delete(nonce)
    }
  }

  private async generateTransaction(
    type: string,
    nonce: number
  ): Promise<ethers.TransactionResponse> {
    const options = { nonce }

    switch (type) {
      case 'transfer':
        return this.wallet.sendTransaction({
          to: ethers.Wallet.createRandom().address,
          value: ethers.parseEther('0.0001'),
          ...options
        })

      case 'erc20':
        const erc20 = new ethers.Contract(
          networks.l2.contracts.erc20,
          ['function transfer(address to, uint256 amount)'],
          this.wallet
        )
        return erc20.transfer(
          ethers.Wallet.createRandom().address,
          ethers.parseUnits('1', 18),
          options
        )

      case 'nft':
        const nft = new ethers.Contract(
          networks.l2.contracts.nft,
          ['function mint(address to)'],
          this.wallet
        )
        return nft.mint(this.wallet.address, options)

      case 'complex':
        const complex = new ethers.Contract(
          networks.l2.contracts.complex,
          ['function complexOperation(uint256 param1, address param2)'],
          this.wallet
        )
        return complex.complexOperation(
          100,
          ethers.Wallet.createRandom().address,
          options
        )

      default:
        throw new Error(`Unknown transaction type: ${type}`)
    }
  }

  get pendingTransactions(): number {
    return this.pendingTxs.size
  }

  calculateMetrics(): NetworkMetrics {
    const completedTxs = this.metrics.transactions.filter(
      tx => tx.status !== 'pending'
    )
    const successfulTxs = completedTxs.filter(tx => tx.status === 'success')
    
    const duration = 
      (this.metrics.transactions[this.metrics.transactions.length - 1].timestamp -
       this.metrics.transactions[0].timestamp) / 1000

    this.metrics.avgTps = successfulTxs.length / duration
    this.metrics.successRate = 
      (successfulTxs.length / completedTxs.length) * 100 || 0
    
    const blockTimes = successfulTxs
      .map(tx => tx.blockTime)
      .filter((time): time is number => time !== undefined)
    this.metrics.avgBlockTime = 
      blockTimes.reduce((sum, time) => sum + time, 0) / blockTimes.length || 0

    const gasUsed = successfulTxs
      .map(tx => tx.gasUsed)
      .filter((gas): gas is bigint => gas !== undefined)
    this.metrics.avgGasUsed = 
      Number(gasUsed.reduce((sum, gas) => sum + gas, BigInt(0))) / gasUsed.length || 0

    return this.metrics
  }
}

export class StressTest {
  private networkTesters: Record<string, NetworkStressTester>
  private isRunning: boolean = false

  constructor(privateKey: string) {
    const providers = {
      l2: new ethers.JsonRpcProvider(networks.l2.rpc),
      linea: new ethers.JsonRpcProvider(networks.linea.rpc),
    }
    
    const wallets = {
      l2: new ethers.Wallet(privateKey, providers.l2),
      linea: new ethers.Wallet(privateKey, providers.linea),
    }

    this.networkTesters = {
      l2: new NetworkStressTester(wallets.l2),
      linea: new NetworkStressTester(wallets.linea),
    }
  }

  async runTest(network: string, config: StressTestConfig): Promise<NetworkMetrics> {
    if (this.isRunning) {
      throw new Error('Stress test already running')
    }

    const tester = this.networkTesters[network]
    if (!tester) {
      throw new Error(`Unknown network: ${network}`)
    }

    this.isRunning = true
    await tester.initialize()

    const startTime = Date.now()
    const endTime = startTime + (config.duration * 1000)

    try {
      while (Date.now() < endTime) {
        const batchSize = Math.min(
          config.tps,
          100 - tester.pendingTransactions
        )

        if (batchSize > 0) {
          const promises = Array(batchSize)
            .fill(0)
            .map(() => tester.sendTransaction(config.transactionType))

          await Promise.all(promises)
        }

        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Wait for pending transactions to complete (up to 60 seconds)
      const maxWait = Date.now() + 60_000
      while (tester.pendingTransactions > 0 && Date.now() < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      return tester.calculateMetrics()
    } finally {
      this.isRunning = false
    }
  }
}