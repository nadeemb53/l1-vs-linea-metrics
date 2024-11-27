'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { MetricData } from '@/types'
import { formatBlockTime } from '@/lib/utils'

interface Props {
  data: MetricData[]
}

export function BlockTimeChart({ data }: Props) {
  // Group data by timestamp to show parallel lines
  const formattedData = data.reduce((acc: any[], curr) => {
    const timestamp = new Date(curr.timestamp).getTime()
    const existing = acc.find(item => item.timestamp === timestamp)
    
    if (existing) {
      existing[curr.network] = curr.value
    } else {
      acc.push({
        timestamp,
        [curr.network]: curr.value
      })
    }
    return acc
  }, []).sort((a, b) => a.timestamp - b.timestamp)

  // Calculate Y-axis domain with some padding
  const maxBlockTime = Math.max(...data.map(d => d.value)) * 1.2
  const minBlockTime = Math.max(0, Math.min(...data.map(d => d.value)) * 0.8)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(value) => new Date(value).toLocaleTimeString()}
          type="number"
          domain={['dataMin', 'dataMax']}
        />
        <YAxis 
          label={{ value: 'Block Time (s)', angle: -90, position: 'insideLeft' }}
          domain={[minBlockTime, maxBlockTime]}
          tickFormatter={(value) => value.toFixed(1)}
        />
        <Tooltip
          labelFormatter={(value) => new Date(value).toLocaleString()}
          formatter={(value: number) => [formatBlockTime(value), 'Block Time']}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="l2"
          name="L2"
          stroke="#8884d8"
          dot={false}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="linea"
          name="Linea"
          stroke="#82ca9d"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}