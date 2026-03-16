<script setup lang="ts">
import SegmentedCircleChart from './SegmentedCircleChart.vue'
import type { PieChartProps, PieSegment } from '../types'

const props = defineProps<PieChartProps>()

const emit = defineEmits<{
  'segment-click': [segment: PieSegment]
}>()
</script>

<template>
  <SegmentedCircleChart
    v-bind="props"
    variant="pie"
    @segment-click="emit('segment-click', $event)"
  />
</template>
