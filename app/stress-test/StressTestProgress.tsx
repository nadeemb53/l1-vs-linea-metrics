import { TransactionLogs } from './TransactionLogs'

interface StressTestProgressProps {
  progress: number
  isRunning: boolean
  selectedNetworks: string[]
  transactions?: {
    network: string
    sent: number
    pending: number
    confirmed: number
    failed: number
    latestBlock?: number
  }[]
  txLogs?: {
    hash: string
    network: string
    status: 'pending' | 'success' | 'failed'
    blockNumber?: number
    timestamp: number
  }[]
}

export function StressTestProgress({ 
  progress, 
  isRunning, 
  selectedNetworks,
  transactions = [],
  txLogs = []
}: StressTestProgressProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Test Progress</h3>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="text-sm text-gray-600">
        {progress.toFixed(1)}% Complete
      </div>

      {transactions.map((tx, i) => (
        <div key={tx.network} className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">{tx.network}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div>Transactions Sent: {tx.sent}</div>
              <div>Pending: {tx.pending}</div>
            </div>
            <div>
              <div>Confirmed: {tx.confirmed}</div>
              <div>Failed: {tx.failed}</div>
            </div>
            {tx.latestBlock && (
              <div className="col-span-2">
                Latest Block: #{tx.latestBlock}
              </div>
            )}
          </div>
        </div>
      ))}

      {isRunning && (
        <div className="flex items-center space-x-2 text-blue-600">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Test in progress...</span>
        </div>
      )}

      <TransactionLogs transactions={txLogs} />
    </div>
  )
}