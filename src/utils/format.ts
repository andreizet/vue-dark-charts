import type { ValueMode } from '../types'

export function formatAxisLabel(label: string): string {
  return /^\d{4}-\d{2}-\d{2}/.test(label) ? label.slice(5) : label
}

export function formatValue(
  value: number,
  valueMode: ValueMode = 'currency',
  digits = 0,
): string {
  if (valueMode === 'percent') {
    return `${value.toFixed(digits)}%`
  }

  if (valueMode === 'number') {
    if (Math.abs(value) >= 1000 && digits === 0) {
      return `${(value / 1000).toFixed(1)}k`
    }
    return value.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  }

  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)

  if (abs >= 1000 && digits === 0) {
    return `${sign}$${(abs / 1000).toFixed(1)}k`
  }

  return `${sign}$${abs.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

export function formatTooltipValue(
  value: number,
  valueMode: ValueMode = 'currency',
): string {
  if (valueMode === 'percent') {
    return `${value.toFixed(2)}%`
  }

  if (valueMode === 'number') {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  }

  const sign = value >= 0 ? '+' : '-'
  return `${sign}$${Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
