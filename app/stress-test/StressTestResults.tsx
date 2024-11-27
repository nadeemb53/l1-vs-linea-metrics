import { NetworkMetrics } from './../../types'

interface StressTestResultsProps {
  results: Record<string, NetworkMetrics>
}

export function StressTestResults({ results }: StressTestResultsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Test Results</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(results).map(([network, metrics]) => (
          <div key={network} className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium mb-3 text-gradient">
              {network.toUpperCase()} Results
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Avg TPS</span>
                <span className="font-medium">{metrics.avgTps.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-medium">{metrics.successRate.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Block Time</span>
                <span className="font-medium">{metrics.avgBlockTime.toFixed(2)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Gas Used</span>
                <span className="font-medium">{Number(metrics.avgGasUsed).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Transactions</span>
                <span className="font-medium">{metrics.transactions.length}</span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-2">Recent Transactions</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {metrics.transactions.slice(-5).map((tx) => (
                  <div 
                    key={tx.hash}
                    className={`text-sm p-1 rounded ${
                      tx.status === 'success' ? 'bg-green-100' :
                      tx.status === 'failed' ? 'bg-red-100' :
                      'bg-yellow-100'
                    }`}
                  >
                    <div className="truncate">
                      {tx.hash}
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>{tx.status}</span>
                      {tx.blockTime && (
                        <span>{tx.blockTime.toFixed(1)}s</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}