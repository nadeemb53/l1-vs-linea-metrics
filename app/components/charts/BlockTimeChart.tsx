'use client'

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { MetricData } from '@/types'

interface Props {
  data: MetricData[]
}

export function BlockTimeChart({ data }: Props) {
  const formattedData = data.map(item => ({
    timestamp: new Date(item.timestamp).getTime(),
    blockTime: item.value,
    network: item.network,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
    <ScatterChart width={500} height={300}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="timestamp"
        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
        name="Time"
      />
      <YAxis label={{ value: 'Block Time (s)', angle: -90, position: 'insideLeft' }} />
      <Tooltip
        cursor={{ strokeDasharray: '3 3' }}
        formatter={(value: number) => [`${value.toFixed(2)}s`, 'Block Time']}
      />
      <Legend />
      <Scatter
        name="L2"
        data={formattedData.filter(d => d.network === 'l2')}
        fill="#8884d8"
        dataKey="blockTime"
      />
      <Scatter
        name="Linea"
        data={formattedData.filter(d => d.network === 'linea')}
        fill="#82ca9d"
        dataKey="blockTime"
      />
    </ScatterChart>
    </ResponsiveContainer>
  )
}