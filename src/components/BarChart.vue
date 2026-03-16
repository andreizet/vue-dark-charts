<script setup lang="ts">
import { computed } from 'vue'
import VerticalBarChart from './bar/VerticalBarChartInternal.vue'
import HorizontalBarChart from './bar/HorizontalBarChartInternal.vue'
import type { BarChartProps } from '../types'

const props = withDefaults(defineProps<BarChartProps>(), {
  theme: 'dark',
  valueMode: 'currency',
  orientation: 'vertical',
  stacked: false,
  neon: true,
})

const component = computed(() =>
  props.orientation === 'horizontal' ? HorizontalBarChart : VerticalBarChart,
)
</script>

<template>
  <component :is="component" v-bind="props" />
</template>
