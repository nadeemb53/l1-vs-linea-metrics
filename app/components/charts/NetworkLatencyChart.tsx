'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { MetricData } from '@/types'

interface Props {
  data: MetricData[]
}

export function NetworkLatencyChart({ data }: Props) {
  const formattedData = data.reduce((acc: any[], curr) => {
    const existingEntry = acc.find(
      entry => entry.timestamp === new Date(curr.timestamp).getTime()
    )
    
    if (existingEntry) {
      existingEntry[curr.network] = curr.value
    } else {
      acc.push({
        timestamp: new Date(curr.timestamp).getTime(),
        [curr.network]: curr.value,
      })
    }
    
    return acc
  }, [])

  return (
    <ResponsiveContainer width="100%" height={300}>
    <AreaChart width={500} height={300} data={formattedData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="timestamp"
        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
      />
      <YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
      <Tooltip
        formatter={(value: number) => [`${value.toFixed(2)}ms`, 'Latency']}
      />
      <Legend />
      <Area type="monotone" dataKey="l2" stackId="1" stroke="#8884d8" fill="#8884d8" />
      <Area type="monotone" dataKey="linea" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
    </AreaChart>
    </ResponsiveContainer>
  )
}