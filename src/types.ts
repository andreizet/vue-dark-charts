export type ChartTheme = 'dark' | 'light' | 'auto'
export type ValueMode = 'currency' | 'percent' | 'number'

export interface ChartPoint {
  x: string
  y: number
}

export interface BaseLineChartProps {
  dotted?: boolean
  showZeroLine?: boolean
  smooth?: boolean
}

export interface SingleLineChartProps extends BaseLineChartProps {
  points: ChartPoint[]
  theme?: ChartTheme
  valueMode?: ValueMode
  format?: (value: number) => string
  color?: string
}

export interface LineChartProps extends BaseLineChartProps {
  points?: ChartPoint[]
  series?: MultiLineSeries[]
  theme?: ChartTheme
  valueMode?: ValueMode
  format?: (value: number) => string
  color?: string
  colors?: string[]
}

export interface MultiLineSeries {
  name: string
  color?: string
  dotted?: boolean
  points: ChartPoint[]
}

export interface MultiLineChartProps {
  series: MultiLineSeries[]
  colors?: string[]
  dotted?: boolean
  showZeroLine?: boolean
  smooth?: boolean
  theme?: ChartTheme
  valueMode?: ValueMode
  format?: (value: number) => string
}

export interface RainbowLineChartProps {
  points: ChartPoint[]
  positiveColor?: string
  negativeColor?: string
  dotted?: boolean
  showZeroLine?: boolean
  smooth?: boolean
  theme?: ChartTheme
  format?: (value: number) => string
}

export type BarOrientation = 'vertical' | 'horizontal'
export type BarGradientDirection = 'vertical' | 'horizontal' | 'diagonal'

export interface BarGradientStop {
  offset: number | string
  color: string
  opacity?: number
}

export interface BarGradient {
  from?: string
  to?: string
  stops?: BarGradientStop[]
  direction?: BarGradientDirection
}

export interface BarDatum {
  label: string
  value: number
  color?: string
  gradient?: BarGradient
}

export interface BarSeries {
  name: string
  color?: string
  gradient?: BarGradient
  bars: BarDatum[]
}

export interface BarChartProps {
  bars?: BarDatum[]
  series?: BarSeries[]
  colors?: string[]
  gradients?: BarGradient[]
  orientation?: BarOrientation
  stacked?: boolean
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

export interface RadialRing {
  label: string
  value: number
  max?: number
  color?: string
}

export interface RadialChartProps {
  rings: RadialRing[]
  theme?: ChartTheme
  centerText?: string
  centerLabel?: string
  format?: (value: number) => string
  startAngle?: number
  ringGap?: number
}

export interface RadarSeries {
  name: string
  color?: string
  fillOpacity?: number
  points: ChartPoint[]
}

export interface RadarChartProps {
  points?: ChartPoint[]
  series?: RadarSeries[]
  theme?: ChartTheme
  valueMode?: ValueMode
  format?: (value: number) => string
  color?: string
  colors?: string[]
  maxValue?: number
  gridLevels?: number
  showDots?: boolean
}
