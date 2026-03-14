<script setup lang="ts">
import BarChart from './BarChart.vue'
import type { BarChartProps } from '../types'

const props = withDefaults(defineProps<BarChartProps>(), {
  theme: 'dark',
  valueMode: 'currency',
  stacked: false,
})
</script>

<template>
  <BarChart v-bind="{ ...props, orientation: 'horizontal' }" />
</template>
