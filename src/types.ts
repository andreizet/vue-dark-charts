export type ChartTheme = 'dark' | 'light' | 'auto'
export type ValueMode = 'currency' | 'percent' | 'number'

export interface ChartPoint {
  x: string
  y: number
}

export interface LineChartProps {
  points: ChartPoint[]
  color?: string
  theme?: ChartTheme
  valueMode?: ValueMode
  format?: (value: number) => string
}

export interface MultiLineSeries {
  name: string
  color?: string
  points: ChartPoint[]
}

export interface MultiLineChartProps {
  series: MultiLineSeries[]
  theme?: ChartTheme
  valueMode?: ValueMode
  format?: (value: number) => string
}

export interface BarDatum {
  label: string
  value: number
  color?: string
}

export interface BarChartProps {
  bars: BarDatum[]
  theme?: ChartTheme
  valueMode?: ValueMode
  format?: (value: number) => string
}

export interface DonutSegment {
  label: string
  value: number
  color?: string
}

export interface DonutChartProps {
  segments: DonutSegment[]
  theme?: ChartTheme
  centerText?: string
  format?: (value: number) => string
}
