import { ethers } from 'ethers'
import { networks } from './blockchain'
import {TransactionInfo, NetworkMetrics, StressTestConfig} from '@/types';

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

  private async getNextNonce(): Promise<number> {
    if (this.nextNonce === null) {
      this.nextNonce = await this.wallet.getNonce()
    }
    return this.nextNonce++
  }

  async sendTransaction(type: TransactionType, network: string): Promise<void> {
    const nonce = await this.getNextNonce()
    
    try {
      const tx = await this.wallet.sendTransaction({
        to: ethers.Wallet.createRandom().address,
        value: ethers.parseEther('0.0001'),
        nonce,
        maxFeePerGas: ethers.parseUnits('1', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei'),
      })

      console.log(`[${type}] Transaction sent: ${tx.hash} (nonce: ${nonce})`)
      this.pendingTxs.add(tx.hash)
      
      this.metrics.transactions.push({
        hash: tx.hash,
        timestamp: Date.now(),
        status: 'pending',
        type,
        nonce
      })

      // Handle transaction confirmation asynchronously
      tx.wait().then(receipt => {
        this.pendingTxs.delete(tx.hash)
        const txRecord = this.metrics.transactions.find(t => t.hash === receipt?.hash)
        if (txRecord) {
          txRecord.status = receipt?.status ? 'success' : 'failed'
          txRecord.gasUsed = receipt?.gasUsed
          txRecord.blockNumber = receipt?.blockNumber
          txRecord.blockTime = (Date.now() - txRecord.timestamp) / 1000
        }
      }).catch(error => {
        console.error(`Failed to confirm transaction ${tx.hash}:`, error)
        this.pendingTxs.delete(tx.hash)
        const failedTx = this.metrics.transactions.find(t => t.hash === tx.hash)
        if (failedTx) {
          failedTx.status = 'failed'
        }
      })

    } catch (error) {
      console.error(`Failed to send transaction with nonce ${nonce}:`, error)
      const failedTx = this.metrics.transactions.find(t => t.nonce === nonce)
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

  private emitUpdate(network: string, stats: any) {
    if (!global.stressTestControllers || global.stressTestControllers.size === 0) {
      console.log('No SSE controllers available')
      return
    }

    try {
      const message = {
        type: 'transactions',
        transactions: [{
          network,
          ...stats
        }]
      }
      
      const encodedMessage = new TextEncoder().encode(`data: ${JSON.stringify(message)}\n\n`)
      
      global.stressTestControllers.forEach((controller, id) => {
        try {
          controller.enqueue(encodedMessage)
        } catch (error) {
          console.error(`Failed to send message to client ${id}:`, error)
          global.stressTestControllers.delete(id)
        }
      })
    } catch (error) {
      console.error('Error emitting update:', error)
    }
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
      let secondStart = Date.now()
      let txThisSecond = 0

      // Send transactions as quickly as possible while maintaining TPS rate
      while (txSent < totalTxToSend) {
        const now = Date.now()
        const elapsed = now - secondStart
        
        // If we haven't hit our TPS target for this second, send more
        if (txThisSecond < config.tps) {
          // Send transactions in smaller batches to avoid overwhelming the node
          const remainingInSecond = config.tps - txThisSecond
          const batchSize = Math.min(remainingInSecond, 5) // Send up to 5 tx at once
          
          const promises = Array(batchSize)
            .fill(0)
            .map(() => tester.sendTransaction(config.transactionType, network))

          await Promise.all(promises)
          txSent += batchSize
          txThisSecond += batchSize

          // Emit progress update
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

        // If we've completed this second's quota, wait for next second
        if (elapsed >= 1000) {
          secondStart = now
          txThisSecond = 0
        } else if (txThisSecond >= config.tps) {
          // Wait for the remainder of the second if we've hit our TPS target
          await new Promise(resolve => setTimeout(resolve, 1000 - elapsed))
          secondStart = Date.now()
          txThisSecond = 0
        }
      }

      console.log(`All ${totalTxToSend} transactions sent. Waiting for confirmations...`)

      // Wait for pending transactions to complete (up to 60 seconds)
      const maxWait = Date.now() + 60_000
      while (tester.pendingTransactions > 0 && Date.now() < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        if (Date.now() - lastProgressUpdate >= 5000) {
          console.log(`Waiting for ${tester.pendingTransactions} pending transactions...`)
          lastProgressUpdate = Date.now()
        }
      }

      return tester.calculateMetrics()
    } finally {
      this.isRunning = false
    }
  }
}