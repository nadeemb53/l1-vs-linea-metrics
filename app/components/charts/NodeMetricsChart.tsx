'use client'

import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { MetricData } from '@/types'

interface Props {
  stateSyncData: MetricData[]
  blockPropData: MetricData[]
  nodeRespData: MetricData[]
}

export function NodeMetricsChart({ stateSyncData, blockPropData, nodeRespData }: Props) {
  const formattedData = stateSyncData.reduce((acc: any[], curr) => {
    const existingEntry = acc.find(
      entry => entry.timestamp === new Date(curr.timestamp).getTime()
    )
    
    const blockProp = blockPropData.find(
      d => d.timestamp.getTime() === curr.timestamp.getTime() && d.network === curr.network
    )
    
    const nodeResp = nodeRespData.find(
      d => d.timestamp.getTime() === curr.timestamp.getTime() && d.network === curr.network
    )
    
    if (existingEntry) {
      existingEntry[`${curr.network}StateSync`] = curr.value
      if (blockProp) existingEntry[`${curr.network}BlockProp`] = blockProp.value
      if (nodeResp) existingEntry[`${curr.network}NodeResp`] = nodeResp.value
    } else {
      acc.push({
        timestamp: new Date(curr.timestamp).getTime(),
        [`${curr.network}StateSync`]: curr.value,
        [`${curr.network}BlockProp`]: blockProp?.value || 0,
        [`${curr.network}NodeResp`]: nodeResp?.value || 0,
      })
    }
    
    return acc
  }, [])

  return (
    <ResponsiveContainer width="100%" height={300}>
    <ComposedChart width={500} height={300} data={formattedData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="timestamp"
        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
      />
      <YAxis />
      <Tooltip
        labelFormatter={(value) => new Date(value).toLocaleTimeString()}
        formatter={(value: number, name: string) => {
          const metricName = name.includes('StateSync') 
            ? 'State Sync' 
            : name.includes('BlockProp')
            ? 'Block Propagation'
            : 'Node Response'
          return [`${value.toFixed(2)}ms`, metricName]
        }}
      />
      <Legend />
      
      {/* L2 Metrics */}
      <Bar dataKey="l2StateSync" fill="#8884d8" name="L2 State Sync" />
      <Line type="monotone" dataKey="l2BlockProp" stroke="#82ca9d" name="L2 Block Prop" />
      <Line type="monotone" dataKey="l2NodeResp" stroke="#ffc658" name="L2 Node Response" />
      
      {/* Linea Metrics */}
      <Bar dataKey="lineaStateSync" fill="#8884d8" fillOpacity={0.5} name="Linea State Sync" />
      <Line 
        type="monotone" 
        dataKey="lineaBlockProp" 
        stroke="#82ca9d" 
        strokeDasharray="5 5" 
        name="Linea Block Prop" 
      />
      <Line 
        type="monotone" 
        dataKey="lineaNodeResp" 
        stroke="#ffc658" 
        strokeDasharray="5 5" 
        name="Linea Node Response" 
      />
    </ComposedChart>
    </ResponsiveContainer>
  )
}