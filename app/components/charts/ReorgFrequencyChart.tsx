// app/components/charts/ReorgFrequencyChart.tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { MetricData } from '@/types'

interface Props {
  data: MetricData[]
}

export function ReorgFrequencyChart({ data }: Props) {
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
      <BarChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(value) => new Date(value).toLocaleTimeString()}
          fontSize={12}
        />
        <YAxis 
          label={{ 
            value: 'Reorgs/Hour', 
            angle: -90, 
            position: 'insideLeft',
            fontSize: 12
          }}
          fontSize={12}
        />
        <Tooltip
          labelFormatter={(value) => new Date(value).toLocaleTimeString()}
          formatter={(value: number) => [`${value.toFixed(4)} reorgs/hr`, 'Frequency']}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '6px',
            padding: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
        <Legend />
        <Bar
          dataKey="l2"
          fill="#8884d8"
          name="L2"
          radius={[4, 4, 0, 0]}
          barSize={20}
        />
        <Bar
          dataKey="linea"
          fill="#82ca9d"
          name="Linea"
          radius={[4, 4, 0, 0]}
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
