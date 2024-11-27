'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { MetricData } from '@/types'

interface Props {
  data: MetricData[]
}

export function TPSChart({ data }: Props) {
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
    <LineChart width={500} height={300} data={formattedData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="timestamp"
        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
      />
      <YAxis />
      <Tooltip
        labelFormatter={(value) => new Date(value).toLocaleTimeString()}
      />
      <Legend />
      <Line type="monotone" dataKey="l2" stroke="#8884d8" name="L2" />
      <Line type="monotone" dataKey="linea" stroke="#82ca9d" name="Linea" />
    </LineChart>
    </ResponsiveContainer>
  )
}