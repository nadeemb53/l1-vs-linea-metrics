import { useState } from 'react'
import { StressTestConfig } from '@/types'

interface StressTestFormProps {
  onStart: (config: StressTestConfig) => void
  disabled: boolean
}

export function StressTestForm({ onStart, disabled }: StressTestFormProps) {
  const [config, setConfig] = useState<StressTestConfig>({
    duration: 10,
    tps: 10,
    transactionType: 'transfer',
    networks: ['l2', 'linea'],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onStart(config)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Duration (seconds)
          </label>
          <input
            type="number"
            value={config.duration}
            onChange={(e) => setConfig({ ...config, duration: Number(e.target.value) })}
            className="w-full rounded-md border border-gray-300 p-2"
            min="1"
            max="3600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Target TPS
          </label>
          <input
            type="number"
            value={config.tps}
            onChange={(e) => setConfig({ ...config, tps: Number(e.target.value) })}
            className="w-full rounded-md border border-gray-300 p-2"
            min="1"
            max="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Transaction Type
          </label>
          <select
            value={config.transactionType}
            onChange={(e) => setConfig({ 
              ...config, 
              transactionType: e.target.value as StressTestConfig['transactionType']
            })}
            className="w-full rounded-md border border-gray-300 p-2"
          >
            <option value="transfer">Simple Transfer</option>
            <option value="erc20">ERC20 Transfer</option>
            <option value="nft">NFT Mint</option>
            <option value="complex">Complex Contract Interaction</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Networks
          </label>
          <div className="space-y-2">
            {['l2', 'linea'].map(network => (
              <label key={network} className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.networks.includes(network)}
                  onChange={(e) => {
                    const networks = e.target.checked
                      ? [...config.networks, network]
                      : config.networks.filter(n => n !== network)
                    setConfig({ ...config, networks })
                  }}
                  className="mr-2"
                />
                {network.toUpperCase()}
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={disabled || config.networks.length === 0}
            className={`w-full py-2 px-4 rounded-md text-white font-medium
                       ${disabled || config.networks.length === 0
                         ? 'bg-gray-400' 
                         : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                       } transition-all duration-300`}
          >
            {disabled ? 'Test in Progress...' : 'Start Test'}
          </button>
        </div>
      </div>
    </form>
  )
}