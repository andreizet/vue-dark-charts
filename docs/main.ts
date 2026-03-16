import { createApp } from 'vue'
import '../src/styles.css'
import {
  BarChart,
  DonutChart,
  HorizontalBarChart,
  LineChart,
  MultiLineChart,
  PieChart,
  RadarChart,
  RadialChart,
  RainbowLineChart,
} from '../src'

declare global {
  interface Window {
    __VDC_APP_OPTIONS__?: Record<string, unknown>
  }
}

const appOptions = window.__VDC_APP_OPTIONS__ ?? {}

createApp({
  ...appOptions,
  components: {
    LineChart,
    MultiLineChart,
    RainbowLineChart,
    BarChart,
    HorizontalBarChart,
    PieChart,
    DonutChart,
    RadarChart,
    RadialChart,
  },
}).mount('#app')
