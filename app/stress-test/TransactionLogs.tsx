'use client'

import { Card } from '@/app/components/ui/card'

interface TransactionLogsProps {
  transactions?: {
    hash: string
    network: string
    status: 'pending' | 'success' | 'failed'
    blockNumber?: number
    timestamp: number
  }[]
}

export function TransactionLogs({ transactions = [] }: TransactionLogsProps) {
  return (
    <Card className="p-4 mt-4">
      <h3 className="text-lg font-semibold mb-4">Transaction Logs</h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {transactions.map((log, i) => (
          <div 
            key={`${log.hash}-${i}`}
            className={`p-2 rounded ${
              log.status === 'success' ? 'bg-green-50' :
              log.status === 'failed' ? 'bg-red-50' :
              'bg-gray-50'
            }`}
          >
            <div className="flex justify-between text-sm">
              <span className="font-medium">{log.network.toUpperCase()}</span>
              <span className="text-gray-500">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-sm truncate">
              <span className="text-gray-600">Tx: </span>
              <span className="font-mono">{log.hash}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className={`
                ${log.status === 'success' ? 'text-green-600' :
                  log.status === 'failed' ? 'text-red-600' :
                  'text-gray-600'}`}
              >
                {log.status.toUpperCase()}
              </span>
              {log.blockNumber && (
                <span className="text-gray-500">
                  Block: {log.blockNumber}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
} 