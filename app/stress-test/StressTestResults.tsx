'use client'

import { Card } from '@/app/components/ui/card'
import { NetworkMetrics } from '@/types'
import { formatTPS, formatBlockTime, formatGasPrice, formatPercent } from '@/lib/utils'

export function StressTestResults({ results }: { results: Record<string, NetworkMetrics> }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Test Results</h2>

      {Object.entries(results).map(([network, metrics]) => (
        <Card key={network} className="p-6">
          <h3 className="text-lg font-semibold mb-4">{network.toUpperCase()} Results</h3>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <div className="text-sm text-gray-600">Average TPS</div>
              <div className="font-medium">{formatTPS(metrics.avgTps)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Success Rate</div>
              <div className="font-medium">{formatPercent(metrics.successRate)}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Avg Block Time</div>
              <div className="font-medium">{formatBlockTime(metrics.avgBlockTime)}s</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Avg Gas Used</div>
              <div className="font-medium">{formatGasPrice(Number(metrics.avgGasUsed))}</div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="mt-4">
            <h4 className="font-medium mb-2">Transaction Details</h4>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Hash</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Block</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Gas Used</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.transactions.map((tx) => (
                    <tr key={tx.hash} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex px-2 text-xs font-semibold rounded-full
                          ${tx.status === 'success' 
                            ? 'bg-green-100 text-green-800'
                            : tx.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {tx.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm font-mono">
                        <div className="truncate max-w-[150px]" title={tx.hash}>
                          {tx.hash}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {tx.blockNumber || '-'}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {tx.gasUsed ? formatGasPrice(Number(tx.gasUsed)) : '-'}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {tx.blockTime ? `${tx.blockTime.toFixed(2)}s` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="mt-6 text-sm text-gray-600">
            <div>Total Transactions: {metrics.transactions.length}</div>
            <div>Successful: {metrics.transactions.filter(tx => tx.status === 'success').length}</div>
            <div>Failed: {metrics.transactions.filter(tx => tx.status === 'failed').length}</div>
            <div>Pending: {metrics.transactions.filter(tx => tx.status === 'pending').length}</div>
          </div>
        </Card>
      ))}
    </div>
  )
}