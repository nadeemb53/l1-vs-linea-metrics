// app/stress-test/StressTestProgress.tsx
import { NetworkMetrics } from './../../types'

interface StressTestProgressProps {
  progress: number
  currentMetrics?: Record<string, NetworkMetrics>
}

export function StressTestProgress({ 
  progress, 
  currentMetrics 
}: StressTestProgressProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Test Progress</h2>
      
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
              Progress
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-blue-600">
              {progress.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-blue-200">
          <div
            style={{ width: `${progress}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          />
        </div>

        {currentMetrics && (
          <div className="space-y-2 mt-4">
            {Object.entries(currentMetrics).map(([network, metrics]) => (
              <div key={network} className="text-sm">
                <div className="font-medium">{network.toUpperCase()}</div>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  <div>Transactions: {metrics.transactions.length}</div>
                  <div>Success Rate: {metrics.successRate.toFixed(1)}%</div>
                  <div>Current TPS: {metrics.avgTps.toFixed(1)}</div>
                  <div>
                    Pending: {
                      metrics.transactions.filter(tx => tx.status === 'pending').length
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}