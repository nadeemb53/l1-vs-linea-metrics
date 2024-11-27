import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Formats a number with proper decimals
export function formatNumber(value: number | null | undefined): string {
  if (value === undefined || value === null) return '-'
  return Number.isInteger(value) ? value.toString() : value.toFixed(2)
}

// Formats numbers with appropriate units
export function formatWithUnits(value: number, unit: string): string {
  const formattedValue = formatNumber(value)
  return `${formattedValue} ${unit}`
}

// Formats gas prices
export function formatGasPrice(value: number): string {
  if (value < 0.01) {
    return `${value.toFixed(9)} Gwei`;
  }
  return `${value.toFixed(4)} Gwei`;
}

// Formats percentages
export function formatPercent(value: number): string {
  return `${formatNumber(value)}%`
}

// Formats milliseconds to a readable duration
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${formatNumber(seconds)}s`
  const minutes = seconds / 60
  return `${formatNumber(minutes)}m`
}

// Calculate percentage change between two values
export function calculatePercentChange(current: number, previous: number): number {
  if (!previous) return 0
  return ((current - previous) / previous) * 100
}

// Truncate text with ellipsis
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text
  return `${text.slice(0, length)}...`
}

// Format blockchain addresses
export function formatAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Convert bytes to human readable size
export function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`
}

// Format TPS with proper units
export function formatTPS(value: number): string {
  return `${formatNumber(value)} TPS`
}

// Format block time
export function formatBlockTime(seconds: number): string {
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`
  return `${formatNumber(seconds)}s`
}

// Format network latency
export function formatLatency(ms: number): string {
  return `${formatNumber(ms)}ms`
}

// Check if a value has significantly changed
export function hasSignificantChange(newValue: number, oldValue: number, threshold = 5): boolean {
  const percentChange = calculatePercentChange(newValue, oldValue)
  return Math.abs(percentChange) >= threshold
}

// Format large numbers with K, M, B suffixes
export function formatLargeNumber(num: number): string {
  const suffixes = ['', 'K', 'M', 'B', 'T']
  const magnitude = Math.floor(Math.log10(Math.abs(num)) / 3)
  if (magnitude === 0) return num.toString()
  const scaled = num / Math.pow(1000, magnitude)
  return `${formatNumber(scaled)}${suffixes[magnitude]}`
}