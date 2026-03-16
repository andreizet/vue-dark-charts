# vue-dark-charts — API Reference

## Installation

```bash
npm install vue-dark-charts
```

```ts
import { LineChart, BarChart, PieChart, DonutChart } from 'vue-dark-charts'
import 'vue-dark-charts/dist/style.css'
```

**Requires:** Vue 3.5+

---

## Quick Start

```vue
<script setup>
import { LineChart } from 'vue-dark-charts'
import 'vue-dark-charts/dist/style.css'

const points = [
  { x: 'Mon', y: 40 },
  { x: 'Tue', y: 72 },
  { x: 'Wed', y: 52 },
  { x: 'Thu', y: 90 },
  { x: 'Fri', y: 130 },
]
</script>

<template>
  <LineChart :points="points" theme="dark" />
</template>
```

---

## Component Reference

### LineChart

Single or multi-series line chart with smooth curves, hover crosshair, and gradient fill.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `points` | `ChartPoint[]` | — | Data points for single-series mode |
| `series` | `MultiLineSeries[]` | — | Multiple named series (use instead of `points` for multi-series) |
| `color` | `string` | `'#3b82f6'` | Line color for single-series mode |
| `colors` | `string[]` | rainbow palette | Colors array for multi-series mode |
| `theme` | `'dark' \| 'light' \| 'auto'` | `'dark'` | Visual theme |
| `valueMode` | `'currency' \| 'percent' \| 'number'` | `'number'` | Tooltip value format |
| `dotted` | `boolean` | `false` | Render line as dashed |
| `showZeroLine` | `boolean` | `true` | Show horizontal zero baseline |
| `smooth` | `boolean` | `true` | Smooth bezier curves vs straight segments |
| `format` | `(value: number) => string` | — | Custom value formatter (overrides valueMode) |

**Example — single series:**
```vue
<LineChart :points="points" theme="dark" color="#f97316" dotted value-mode="number" />
```

**Example — multi-series:**
```vue
<LineChart :series="series" theme="dark" value-mode="number" />
```

---

### MultiLineChart

Alias for `LineChart` in multi-series mode. `series` is required.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `series` | `MultiLineSeries[]` | **required** | Multiple named series |
| `colors` | `string[]` | rainbow palette | Colors per series |
| `theme` | `'dark' \| 'light' \| 'auto'` | `'dark'` | Visual theme |
| `valueMode` | `'currency' \| 'percent' \| 'number'` | `'number'` | Tooltip value format |
| `format` | `(value: number) => string` | — | Custom value formatter |

---

### RainbowLineChart

Line chart that fills areas above zero in one color and below zero in another. Ideal for P&L, temperature anomalies, and portfolio returns.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `points` | `ChartPoint[]` | **required** | Data points |
| `positiveColor` | `string` | `'#22c55e'` | Fill color for values above zero |
| `negativeColor` | `string` | `'#ef4444'` | Fill color for values below zero |
| `dotted` | `boolean` | `false` | Dashed line style |
| `showZeroLine` | `boolean` | `true` | Show zero baseline |
| `smooth` | `boolean` | `true` | Smooth bezier curves |
| `theme` | `'dark' \| 'light' \| 'auto'` | `'dark'` | Visual theme |
| `format` | `(value: number) => string` | — | Custom value formatter |

**Example:**
```vue
<RainbowLineChart
  :points="points"
  positive-color="#06b6d4"
  negative-color="#fb7185"
  theme="dark"
/>
```

---

### BarChart

Vertical or horizontal bars. Supports single series, grouped multi-series side-by-side, and stacked. Supports gradient fills.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `bars` | `BarDatum[]` | — | Single-series bars |
| `series` | `BarSeries[]` | — | Multi-series grouped or stacked bars |
| `colors` | `string[]` | rainbow palette | Colors for multi-series |
| `gradients` | `BarGradient[]` | — | Gradient definitions |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Bar direction |
| `stacked` | `boolean` | `false` | Stack series instead of grouping side-by-side |
| `theme` | `'dark' \| 'light' \| 'auto'` | `'dark'` | Visual theme |
| `valueMode` | `'currency' \| 'percent' \| 'number'` | `'number'` | Tooltip value format |
| `format` | `(value: number) => string` | — | Custom value formatter |

**Example — stacked horizontal:**
```vue
<BarChart :series="series" orientation="horizontal" stacked theme="dark" />
```

---

### HorizontalBarChart

Convenience alias for `BarChart` with `orientation="horizontal"` pre-set. Accepts the same props as `BarChart`.

---

### DonutChart

Segmented ring chart with optional center text. Segments are interactive and emit click events.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `segments` | `DonutSegment[]` | **required** | Chart segments |
| `centerText` | `string` | — | Text displayed in the donut center hole |
| `theme` | `'dark' \| 'light' \| 'auto'` | `'dark'` | Visual theme |
| `format` | `(value: number) => string` | — | Custom value formatter |

**Events:**
| Event | Payload | Description |
|-------|---------|-------------|
| `segment-click` | `DonutSegment` | Emitted when user clicks a segment |

**Example:**
```vue
<DonutChart
  :segments="segments"
  center-text="Portfolio"
  theme="dark"
  @segment-click="onSegmentClick"
/>
```

---

### PieChart

Segmented pie chart with the same interactive legend and click behavior as `DonutChart`, but without the center hole.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `segments` | `PieSegment[]` | **required** | Chart segments |
| `theme` | `'dark' \| 'light' \| 'auto'` | `'dark'` | Visual theme |
| `format` | `(value: number) => string` | — | Custom value formatter |

**Events:**
| Event | Payload | Description |
|-------|---------|-------------|
| `segment-click` | `PieSegment` | Emitted when user clicks a segment |

**Example:**
```vue
<PieChart
  :segments="segments"
  theme="dark"
  @segment-click="onSegmentClick"
/>
```

---

### RadialChart

Concentric progress rings, each with its own label, value, and color. Customizable start angle and ring spacing.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rings` | `RadialRing[]` | **required** | Ring definitions |
| `centerText` | `string` | — | Main text in the center |
| `centerLabel` | `string` | `'progress'` | Secondary label below center text |
| `startAngle` | `number` | `135` | Ring start angle in degrees |
| `ringGap` | `number` | `8` | Gap between rings in pixels |
| `theme` | `'dark' \| 'light' \| 'auto'` | `'dark'` | Visual theme |
| `format` | `(value: number) => string` | — | Custom value formatter |

**Events:**
| Event | Payload | Description |
|-------|---------|-------------|
| `ring-click` | `RadialRing` | Emitted when user clicks a ring |

---

### RadarChart

Spider/polygon chart for comparing multiple dimensions. Supports single and multi-series overlays.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `points` | `ChartPoint[]` | — | Single-series data points |
| `series` | `RadarSeries[]` | — | Multi-series data |
| `color` | `string` | `'#3b82f6'` | Color for single-series mode |
| `colors` | `string[]` | rainbow palette | Colors for multi-series |
| `valueMode` | `'currency' \| 'percent' \| 'number'` | `'number'` | Tooltip value format |
| `maxValue` | `number` | auto | Override the maximum grid value |
| `gridLevels` | `number` | `5` | Number of grid rings (3–8) |
| `showDots` | `boolean` | `false` | Show data point dots on the polygon |
| `theme` | `'dark' \| 'light' \| 'auto'` | `'dark'` | Visual theme |
| `format` | `(value: number) => string` | — | Custom value formatter |

---

## Types Reference

```typescript
interface ChartPoint {
  x: string
  y: number
}

interface MultiLineSeries {
  name: string
  color?: string
  dotted?: boolean
  points: ChartPoint[]
}

interface BarDatum {
  label: string
  value: number
  color?: string
  gradient?: BarGradient
}

interface BarSeries {
  name: string
  color?: string
  gradient?: BarGradient
  bars: BarDatum[]
}

interface BarGradient {
  from?: string
  to?: string
  stops?: Array<{ offset: string; color: string }>
  direction?: 'vertical' | 'horizontal' | 'diagonal'
}

interface DonutSegment {
  label: string
  value: number
  color?: string
}

interface PieSegment {
  label: string
  value: number
  color?: string
}

interface RadialRing {
  label: string
  value: number
  max?: number
  color?: string
}

interface RadarSeries {
  name: string
  color?: string
  fillOpacity?: number
  points: ChartPoint[]
}
```

---

## Theming

All components accept a `theme` prop:

| Value | Behavior |
|-------|----------|
| `'dark'` | Forces dark theme regardless of system preference |
| `'light'` | Forces light theme |
| `'auto'` | Follows OS `prefers-color-scheme` setting |

The library uses CSS custom properties under `[data-vdc-theme]` attribute. You can override any variable in your own stylesheet:

```css
[data-vdc-theme='dark'] {
  --vdc-bg: #0a0f1e;
  --vdc-surface: rgba(255, 255, 255, 0.04);
  --vdc-text: #e2e8f0;
  --vdc-text-muted: #94a3b8;
  --vdc-border: rgba(148, 163, 184, 0.15);
  --vdc-accent: #3b82f6;
}
```

---

## Value Formatting

### Built-in modes via `valueMode`

| Value | Example output |
|-------|---------------|
| `'number'` | `1,234` |
| `'currency'` | `$1,234` |
| `'percent'` | `12.3%` |

### Custom formatter

Pass a `format` function to fully control the tooltip display:

```vue
<LineChart
  :points="points"
  :format="(v) => `${v.toFixed(1)} BTC`"
/>
```

The `format` function takes precedence over `valueMode` when both are provided.
