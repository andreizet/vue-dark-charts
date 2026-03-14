# vue-dark-charts

Small Vue 3 SVG charts extracted from this repo into a standalone package.

## Included charts

- `LineChart`
- `MultiLineChart`
- `RainbowLineChart`
- `BarChart`
- `HorizontalBarChart`
- `DonutChart`

## Development

```bash
npm install
npm run dev
```

That opens the Vite playground from `playground.html`.

## Local HTML preview

```bash
npm run build
```

Then open `index.html` directly in the browser with `file://.../vue-dark-charts/index.html`.
That page is filesystem-safe and loads `./node_modules/vue/dist/vue.global.prod.js` plus
`./dist/vue-dark-charts.iife.js`.

Build output lands in `dist/`.

## Basic usage

```ts
import { createApp } from 'vue'
import App from './App.vue'
import 'vue-dark-charts/style.css'

createApp(App).mount('#app')
```

```vue
<script setup lang="ts">
import { LineChart } from 'vue-dark-charts'

const points = [
  { x: '2026-03-01', y: 120 },
  { x: '2026-03-02', y: 180 },
  { x: '2026-03-03', y: 140 },
]
</script>

<template>
  <div style="height: 280px;">
    <LineChart
      :points="points"
      theme="dark"
      color="#38bdf8"
      dotted
      :smooth="false"
      :show-zero-line="false"
    />
  </div>
</template>
```

## Line chart options

`LineChart`

- accepts either `points` for a single series or `series` for multiple lines
- `color?: string`
- `colors?: string[]` when using `series`
- `dotted?: boolean`
- `series[].dotted?: boolean` when using `series` to mix solid and dotted lines
- `showZeroLine?: boolean`
- `smooth?: boolean`

`MultiLineChart`

- compatibility wrapper around `LineChart` for multi-series usage
- `colors?: string[]` for fallback per-series colors
- `series[].color?: string` still overrides an individual line
- `series[].dotted?: boolean` lets one series stay solid while another is dotted
- `dotted?: boolean`
- `showZeroLine?: boolean`
- `smooth?: boolean`

`RainbowLineChart`

- `positiveColor?: string`
- `negativeColor?: string`
- `dotted?: boolean`
- `showZeroLine?: boolean`
- `smooth?: boolean`

## Bar chart options

`BarChart`

- accepts either `bars` for a single series or `series` for grouped / stacked bars
- `orientation?: 'vertical' | 'horizontal'`
- `stacked?: boolean`
- `colors?: string[]` for fallback per-series solid fills
- `gradients?: BarGradient[]` for fallback per-series gradients
- `bars[].color?: string`
- `bars[].gradient?: { from?: string; to?: string; stops?: { offset; color; opacity? }[] }`
- `series[].color?: string`
- `series[].gradient?: { from?: string; to?: string; stops?: { offset; color; opacity? }[] }`

`HorizontalBarChart`

- compatibility alias for `<BarChart orientation="horizontal" />`
