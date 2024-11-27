interface StressTestProgressProps {
  progress: number
  isRunning: boolean
  selectedNetworks: string[]
}

export function StressTestProgress({ 
  progress, 
  isRunning,
  selectedNetworks 
}: StressTestProgressProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Test Progress</h2>
      
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
              {isRunning ? 'Running Test...' : 'Test Complete'}
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

        <div className="space-y-2 mt-4">
          {selectedNetworks.map((network) => (
            <div key={network} className="text-sm">
              <div className="font-medium">
                {network.toUpperCase()}
                <span className="ml-2 text-blue-600">
                  {isRunning ? 'Running...' : 'Complete'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}