<script setup lang="ts">
import LineChart from './LineChart.vue'
import type { MultiLineChartProps } from '../types'

const props = withDefaults(defineProps<MultiLineChartProps>(), {
  theme: 'dark',
  valueMode: 'currency',
  dotted: false,
  showZeroLine: true,
  smooth: true,
})
</script>

<template>
  <LineChart v-bind="props" />
</template>
