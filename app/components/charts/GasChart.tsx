'use client'
import { ethers } from 'ethers'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { MetricData } from '@/types'

interface Props {
  data: MetricData[]
}

export function GasChart({ data }: Props) {
  const formattedData = data.reduce((acc: any[], curr) => {
    const existingEntry = acc.find(
      entry => entry.timestamp === new Date(curr.timestamp).getTime()
    )
    
    if (existingEntry) {
      existingEntry[curr.network] = parseFloat(ethers.formatUnits(curr.value, 'gwei'))
    } else {
      acc.push({
        timestamp: new Date(curr.timestamp).getTime(),
        [curr.network]: parseFloat(ethers.formatUnits(curr.value, 'gwei')),
      })
    }
    
    return acc
  }, [])

  return (
    <ResponsiveContainer width="100%" height={300}>
    <BarChart width={500} height={300} data={formattedData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="timestamp"
        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
      />
      <YAxis label={{ value: 'Gas Price (Gwei)', angle: -90, position: 'insideLeft' }} />
      <Tooltip
        labelFormatter={(value) => new Date(value).toLocaleTimeString()}
        formatter={(value: number) => [`${value.toFixed(2)} Gwei`, 'Gas Price']}
      />
      <Legend />
      <Bar dataKey="l2" fill="#8884d8" name="L2" />
      <Bar dataKey="linea" fill="#82ca9d" name="Linea" />
    </BarChart>
    </ResponsiveContainer>
  )
}