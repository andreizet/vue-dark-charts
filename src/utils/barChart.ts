import type {
  BarChartProps,
  BarDatum,
  BarGradient,
  BarGradientDirection,
  BarSeries,
} from '../types'

type BarPalette = {
  positive: string
  negative: string
}

export interface ResolvedBarFill {
  color: string
  gradient?: BarGradient
}

export interface ResolvedBarDatum {
  label: string
  value: number
  fill: ResolvedBarFill
}

export interface ResolvedBarSeries {
  name: string
  bars: ResolvedBarDatum[]
}

export interface NormalizedBarChartData {
  isMultiMode: boolean
  labels: string[]
  series: ResolvedBarSeries[]
}

const SERIES_FALLBACK_COLORS = [
  '#14b8a6',
  '#315efb',
  '#f59e0b',
  '#38bdf8',
  '#f472b6',
  '#a78bfa',
]

function createFallbackColors(palette: BarPalette): string[] {
  return [palette.positive, ...SERIES_FALLBACK_COLORS]
}

function hasGradient(gradient?: BarGradient): gradient is BarGradient {
  return Boolean(
    gradient &&
      ((gradient.stops && gradient.stops.length > 0) || gradient.from || gradient.to),
  )
}

function resolveSingleBarFill(
  bar: BarDatum,
  props: BarChartProps,
  palette: BarPalette,
): ResolvedBarFill {
  if (hasGradient(bar.gradient)) {
    return {
      color: bar.color ?? (bar.value >= 0 ? palette.positive : palette.negative),
      gradient: bar.gradient,
    }
  }

  if (hasGradient(props.gradients?.[0])) {
    return {
      color: bar.color ?? props.colors?.[0] ?? (bar.value >= 0 ? palette.positive : palette.negative),
      gradient: props.gradients?.[0],
    }
  }

  return {
    color: bar.color ?? props.colors?.[0] ?? (bar.value >= 0 ? palette.positive : palette.negative),
  }
}

function resolveSeriesBaseFill(
  series: BarSeries,
  index: number,
  props: BarChartProps,
  palette: BarPalette,
): ResolvedBarFill {
  const fallbackColors = createFallbackColors(palette)
  const color = series.color ?? props.colors?.[index] ?? fallbackColors[index % fallbackColors.length]
  const gradient = series.gradient ?? props.gradients?.[index]

  return hasGradient(gradient) ? { color, gradient } : { color }
}

function resolveSeriesBarFill(
  bar: BarDatum,
  baseFill: ResolvedBarFill,
): ResolvedBarFill {
  if (hasGradient(bar.gradient)) {
    return {
      color: bar.color ?? baseFill.color,
      gradient: bar.gradient,
    }
  }

  if (bar.color) {
    return {
      color: bar.color,
    }
  }

  return baseFill
}

function getOrderedLabels(series: BarSeries[]): string[] {
  const seen = new Set<string>()
  const labels: string[] = []

  for (const entry of series) {
    for (const bar of entry.bars) {
      if (!seen.has(bar.label)) {
        seen.add(bar.label)
        labels.push(bar.label)
      }
    }
  }

  return labels
}

export function normalizeBarChartData(
  props: BarChartProps,
  palette: BarPalette,
): NormalizedBarChartData {
  if (props.series?.length) {
    return {
      isMultiMode: true,
      labels: getOrderedLabels(props.series),
      series: props.series.map((series, index) => {
        const baseFill = resolveSeriesBaseFill(series, index, props, palette)

        return {
          name: series.name,
          bars: series.bars.map((bar) => ({
            label: bar.label,
            value: bar.value,
            fill: resolveSeriesBarFill(bar, baseFill),
          })),
        }
      }),
    }
  }

  const bars = props.bars ?? []

  return {
    isMultiMode: false,
    labels: bars.map((bar) => bar.label),
    series: [
      {
        name: 'Series',
        bars: bars.map((bar) => ({
          label: bar.label,
          value: bar.value,
          fill: resolveSingleBarFill(bar, props, palette),
        })),
      },
    ],
  }
}

export function resolveGradientVector(
  direction: BarGradientDirection | undefined,
  fallbackDirection: 'vertical' | 'horizontal',
) {
  const effectiveDirection = direction ?? fallbackDirection

  if (effectiveDirection === 'horizontal') {
    return { x1: '0%', y1: '0%', x2: '100%', y2: '0%' }
  }

  if (effectiveDirection === 'diagonal') {
    return { x1: '0%', y1: '100%', x2: '100%', y2: '0%' }
  }

  return { x1: '0%', y1: '100%', x2: '0%', y2: '0%' }
}
