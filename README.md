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
    <LineChart :points="points" theme="dark" />
  </div>
</template>
```
