// components/MetricsCard.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { calculatePercentChange } from "@/lib/utils"

export interface MetricsCardProps {
  title: string
  l2: number
  linea: number
  formatValue: (value: number) => string
  comparison?: string
  inverted?: boolean
  className?: string
}

export function MetricsCard({ 
  title, 
  l2, 
  linea, 
  formatValue = (v: number) => v.toString(), 
  comparison = 'vs Linea',
  inverted = false,
  className = ''
}: MetricsCardProps) {
  const l2Value = typeof l2 === 'number' ? l2 : 0;
  const lineaValue = typeof linea === 'number' ? linea : 0;
  
  const { change, trend, description } = calculateComparison(l2Value, lineaValue, inverted)

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gradient">
          {title}
        </CardTitle>
        {trend !== 'neutral' && (
          <div className={cn(
            "flex items-center text-xs font-medium rounded-full px-2 py-1",
            trend === 'up' 
              ? "bg-green-100 text-green-600" 
              : "bg-red-100 text-red-600"
          )}>
            {trend === 'up' ? (
              <ArrowUpIcon className="mr-1 h-3 w-3" />
            ) : (
              <ArrowDownIcon className="mr-1 h-3 w-3" />
            )}
            <span className={cn(
              "value-change",
              trend === 'up' ? "value-change-up" : "value-change-down"
            )}>
              {Math.abs(Math.round(change))}%
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatValue(l2Value)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {comparison}
        </p>
        <div className="mt-2 p-2 rounded-md bg-opacity-50 backdrop-blur-sm
                      bg-gradient-to-r from-gray-50 to-gray-100
                      border border-gray-200 border-opacity-50">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Linea: {formatValue(lineaValue)}
            </p>
            <p className={cn(
              "text-xs font-medium",
              trend === 'up' ? "text-green-600" : trend === 'down' ? "text-red-600" : "text-gray-600"
            )}>
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function calculateComparison(l2Value: number, lineaValue: number, inverted: boolean = false) {
  if (lineaValue === 0) {
    return { 
      change: 0, 
      trend: 'neutral' as const,
      description: 'No comparison data available'
    }
  }

  const diff = calculatePercentChange(l2Value, lineaValue)
  const trend = inverted ? (diff < 0 ? 'up' : 'down') : (diff > 0 ? 'up' : 'down')
  
  let description = ''
  const percentDiff = Math.abs(Math.round(diff))
  
  if (trend === 'up') {
    description = inverted
      ? `${percentDiff}% better than Linea`
      : `${percentDiff}% higher than Linea`
  } else {
    description = inverted
      ? `${percentDiff}% worse than Linea`
      : `${percentDiff}% lower than Linea`
  }

  return {
    change: diff,
    trend,
    description
  }
}