'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { MetricData } from '@/types'

interface Props {
  data: MetricData[]
}

export function ProofTimeChart({ data }: Props) {
  const formattedData = data.reduce((acc: any[], curr) => {
    const existingEntry = acc.find(
      entry => entry.timestamp === curr.timestamp.getTime()
    )
    
    if (existingEntry) {
      existingEntry[curr.network] = curr.value
    } else {
      acc.push({
        timestamp: curr.timestamp.getTime(),
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
      <YAxis />
      <Tooltip
        labelFormatter={(value) => new Date(value).toLocaleTimeString()}
        formatter={(value: number) => [`${value.toFixed(2)}ms`, 'Proof Time']}
      />
      <Legend />
      <Area type="monotone" dataKey="l2" fill="#8884d8" stroke="#8884d8" name="L2" />
      <Area type="monotone" dataKey="linea" fill="#82ca9d" stroke="#82ca9d" name="Linea" />
    </AreaChart>
    </ResponsiveContainer>
  )
}