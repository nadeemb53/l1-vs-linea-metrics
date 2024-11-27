import { ethers } from 'ethers'
import { networks } from './blockchain'
import {TransactionInfo, NetworkMetrics, StressTestConfig} from '@/types';
import { broadcastSseMessage } from '../app/api/stress-test/status/sseUtils'

type TransactionType = StressTestConfig['transactionType']

declare global {
  var stressTestControllers: Map<string, ReadableStreamController<Uint8Array>>
}

interface TxLogMessage {
  hash: string
  network: string
  status: 'pending' | 'success' | 'failed'
  timestamp: number
  blockNumber?: number
}

interface NetworkMetricsInternal {
  transactions: TransactionInfo[]
  avgTps: number
  successRate: number
  avgBlockTime: number
  avgGasUsed: number
}

class NetworkStressTester {
  private wallet: ethers.Wallet
  private pendingTxs: Set<string> = new Set()
  private metrics: NetworkMetricsInternal
  private nextNonce: number | null = null

  constructor(wallet: ethers.Wallet) {
    this.wallet = wallet
    this.metrics = {
      transactions: [],
      avgTps: 0,
      successRate: 0,
      avgBlockTime: 0,
      avgGasUsed: 0
    }
  }

  async sendBatchTransactions(
    type: TransactionType, 
    network: string, 
    count: number,
    targetTps: number
  ): Promise<void> {
    if (this.nextNonce === null) {
      this.nextNonce = await this.wallet.getNonce()
    }

    const batchSize = 10
    const batches = Math.ceil(count / batchSize)
    const batchInterval = 1000 / (targetTps / batchSize) // ms between batches

    for (let i = 0; i < batches; i++) {
      const batchStart = Date.now()
      const batchCount = Math.min(batchSize, count - i * batchSize)
      
      const transactions = Array(batchCount).fill(0).map((_, index) => {
        const nonce = this.nextNonce! + index
        return {
          to: ethers.Wallet.createRandom().address,
          value: ethers.parseEther('0.0001'),
          nonce,
          maxFeePerGas: ethers.parseUnits('2', 'gwei'),
          maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
          type: 2, // EIP-1559
          gasLimit: 21000,
        }
      })

      const promises = transactions.map(tx => this.sendTransaction(tx, type))
      await Promise.all(promises)

      this.nextNonce += batchCount

      // Wait for the next batch interval
      const elapsed = Date.now() - batchStart
      const waitTime = Math.max(0, batchInterval - elapsed)
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  private async sendTransaction(tx: ethers.TransactionRequest, type: TransactionType) {
    try {
      const response = await this.wallet.sendTransaction(tx)
      console.log(`[${type}] Transaction sent: ${response.hash} (nonce: ${tx.nonce})`)
      
      this.pendingTxs.add(response.hash)
      this.metrics.transactions.push({
        hash: response.hash,
        timestamp: Date.now(),
        status: 'pending',
        type,
        nonce: tx.nonce as number
      })

      response.wait().then(receipt => {
        if (!receipt) return;
        this.pendingTxs.delete(response.hash)
        const txRecord = this.metrics.transactions.find(t => t.hash === receipt.hash)
        if (txRecord) {
          txRecord.status = receipt.status ? 'success' : 'failed'
          txRecord.gasUsed = receipt.gasUsed
          txRecord.blockNumber = receipt.blockNumber
          txRecord.blockTime = (Date.now() - txRecord.timestamp) / 1000
        }
      }).catch(error => {
        console.error(`Failed to confirm transaction ${response.hash}:`, error)
        this.pendingTxs.delete(response.hash)
        const failedTx = this.metrics.transactions.find(t => t.hash === response.hash)
        if (failedTx) {
          failedTx.status = 'failed'
        }
      })

    } catch (error) {
      console.error(`Failed to send transaction with nonce ${tx.nonce}:`, error)
      const failedTx = this.metrics.transactions.find(t => t.nonce === tx.nonce)
      if (failedTx) {
        failedTx.status = 'failed'
      }
    }
  }

  get pendingTransactions(): number {
    return this.pendingTxs.size
  }

  calculateMetrics(): NetworkMetrics {
    const completedTxs = this.metrics.transactions.filter(tx => tx.status !== 'pending')
    const successfulTxs = completedTxs.filter(tx => tx.status === 'success')
    
    const duration = completedTxs.length > 0 ? 
      (completedTxs[completedTxs.length - 1].timestamp - completedTxs[0].timestamp) / 1000 : 0

    return {
      avgTps: duration > 0 ? successfulTxs.length / duration : 0,
      successRate: completedTxs.length > 0 ? (successfulTxs.length / completedTxs.length) * 100 : 0,
      avgBlockTime: successfulTxs.reduce((sum, tx) => sum + (tx.blockTime || 0), 0) / successfulTxs.length || 0,
      avgGasUsed: successfulTxs.reduce((sum, tx) => sum + Number(tx.gasUsed || 0), 0) / successfulTxs.length || 0,
      transactions: this.metrics.transactions
    }
  }

  private emitTxLog(tx: TxLogMessage) {
    broadcastSseMessage({
      type: 'txLog',
      tx
    })
  }

  // ... rest of the class implementation ...
}

export class StressTest {
  private networkTesters: Record<string, NetworkStressTester>
  private isRunning: boolean = false
  private providers: Record<string, ethers.Provider>
  private wallets: Record<string, ethers.Wallet>

  constructor(privateKey: string) {
    const providers = {
      l2: new ethers.JsonRpcProvider(networks.l2.rpc),
      linea: new ethers.JsonRpcProvider(networks.linea.rpc),
    }
    
    this.wallets = {
      l2: new ethers.Wallet(privateKey, providers.l2),
      linea: new ethers.Wallet(privateKey, providers.linea),
    }

    this.networkTesters = {
      l2: new NetworkStressTester(this.wallets.l2),
      linea: new NetworkStressTester(this.wallets.linea),
    }
    this.providers = providers
  }

  async runTest(network: string, config: StressTestConfig): Promise<NetworkMetrics> {
    this.isRunning = true
    const startTime = Date.now()
    const endTime = startTime + (config.duration * 1000)
    const tester = new NetworkStressTester(this.wallets[network])
    
    try {
      const totalTxToSend = config.tps * config.duration
      let txSent = 0
      let lastProgressUpdate = Date.now()
      let testCompleted = false

      while (txSent < totalTxToSend && Date.now() < endTime) {
        const remainingTx = totalTxToSend - txSent
        const batchSize = Math.min(remainingTx, config.tps) // Send up to 1 second worth of transactions

        await tester.sendBatchTransactions(config.transactionType, network, batchSize, config.tps)
        txSent += batchSize

        // Update progress
        const now = Date.now()
        if (now - lastProgressUpdate >= 1000) {
          const progress = (txSent / totalTxToSend) * 100
          console.log(`Progress: ${progress.toFixed(1)}% - Sent ${txSent}/${totalTxToSend} transactions`)
          
          this.emitUpdate(network, {
            sent: txSent,
            pending: tester.pendingTransactions,
            confirmed: txSent - tester.pendingTransactions,
            failed: 0,
            progress,
            latestBlock: await this.providers[network].getBlockNumber()
          })
          
          lastProgressUpdate = now
        }
      }

      testCompleted = txSent >= totalTxToSend

      console.log(`${txSent} out of ${totalTxToSend} transactions sent. Waiting for confirmations...`)
      if (!testCompleted) {
        console.warn(`Test ended before all transactions could be sent. Only ${txSent} out of ${totalTxToSend} were sent.`)
      }

      // Wait for pending transactions to complete (up to 60 seconds)
      const maxWait = Date.now() + 60_000
      while (tester.pendingTransactions > 0 && Date.now() < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        if (Date.now() - lastProgressUpdate >= 5000) {
          console.log(`Waiting for ${tester.pendingTransactions} pending transactions...`)
          lastProgressUpdate = Date.now()
        }
      }

      const metrics = tester.calculateMetrics()
      return {
        ...metrics,
        testCompleted // Add this flag to the returned metrics
      }
    } finally {
      this.isRunning = false
    }
  }

  private emitUpdate(network: string, stats: any) {
    broadcastSseMessage({
      type: 'transactions',
      transactions: [{
        network,
        ...stats
      }]
    })
  }
}