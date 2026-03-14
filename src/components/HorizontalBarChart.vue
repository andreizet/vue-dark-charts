<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useResize } from '../composables/useResize'
import { useTheme } from '../composables/useTheme'
import { formatTooltipValue } from '../utils/format'
import type { BarChartProps } from '../types'

const props = withDefaults(defineProps<BarChartProps>(), {
  theme: 'dark',
  valueMode: 'currency',
})

const rootRef = ref<HTMLDivElement | null>(null)
const { width: cw, height: ch } = useResize(rootRef)
const { palette } = useTheme(rootRef, toRef(props, 'theme'))

const bars = computed(() =>
  props.bars.map((bar) => ({
    ...bar,
    color: bar.color ?? (bar.value >= 0 ? palette.value.positive : palette.value.negative),
  })),
)

const labelWidth = 52
const PAD = { top: 8, right: 8, bottom: 8, left: labelWidth }
const innerWidth = computed(() => Math.max(1, cw.value - PAD.left - PAD.right))
const innerHeight = computed(() => Math.max(1, ch.value - PAD.top - PAD.bottom))

const minValue = computed(() => Math.min(0, ...bars.value.map((bar) => bar.value)))
const maxValue = computed(() => Math.max(0, ...bars.value.map((bar) => bar.value)))
const valueRange = computed(() => Math.max(maxValue.value - minValue.value, 0.01))

function bx(value: number): number {
  return PAD.left + ((value - minValue.value) / valueRange.value) * innerWidth.value
}

const zeroX = computed(() => bx(0))

const rowFill = 0.52
const rowHeight = computed(() => innerHeight.value / Math.max(1, bars.value.length))
const barHeight = computed(() => Math.max(6, rowHeight.value * rowFill))

function rowY(index: number): number {
  return PAD.top + index * rowHeight.value + (rowHeight.value - barHeight.value) / 2
}

function barRect(value: number): { x: number; width: number } {
  const valueX = bx(value)
  return {
    x: Math.min(valueX, zeroX.value),
    width: Math.max(2, Math.abs(valueX - zeroX.value)),
  }
}

function formatBarValue(value: number): string {
  if (props.format) {
    return props.format(value)
  }

  return formatTooltipValue(value, props.valueMode)
}

const hoveredIndex = ref<number | null>(null)
const mouseX = ref(0)

function onMouseMove(event: MouseEvent) {
  const element = event.currentTarget as SVGElement | null
  if (!element) {
    return
  }

  const rect = element.getBoundingClientRect()
  const scaleY = ch.value / Math.max(rect.height, 1)
  const scaleX = cw.value / Math.max(rect.width, 1)

  mouseX.value = (event.clientX - rect.left) * scaleX
  const y = (event.clientY - rect.top) * scaleY - PAD.top
  const index = Math.floor(y / rowHeight.value)
  hoveredIndex.value = index >= 0 && index < bars.value.length ? index : null
}

function onLeave() {
  hoveredIndex.value = null
}

const tooltipWidth = 132
const tooltipHeight = 44

const tooltipX = computed(() => {
  const next = mouseX.value + 14
  return next + tooltipWidth > cw.value - PAD.right
    ? mouseX.value - 14 - tooltipWidth
    : next
})

const tooltipY = computed(() => {
  if (hoveredIndex.value === null) {
    return 0
  }

  const currentRowY = rowY(hoveredIndex.value)
  const above = currentRowY - tooltipHeight - 8
  return above >= PAD.top ? above : currentRowY + barHeight.value + 8
})
</script>

<template>
  <div ref="rootRef" class="vdc-root vdc-chart">
    <div v-if="!bars.length" class="vdc-empty">No chart data yet.</div>
    <svg
      v-else-if="cw > 0 && ch > 0"
      :width="cw"
      :height="ch"
      style="display: block; overflow: visible;"
      @mousemove="onMouseMove"
      @mouseleave="onLeave"
    >
      <line
        v-if="minValue < 0"
        :x1="zeroX"
        :y1="PAD.top"
        :x2="zeroX"
        :y2="ch - PAD.bottom"
        :stroke="palette.zeroLine"
        stroke-width="1"
      />

      <g v-for="(bar, index) in bars" :key="`${bar.label}-${index}`">
        <rect
          :x="PAD.left"
          :y="rowY(index)"
          :width="innerWidth"
          :height="barHeight"
          rx="3"
          :fill="palette.track"
          :style="{
            opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.35 : 1,
            transition: 'opacity 0.18s ease',
          }"
        />

        <rect
          :x="barRect(bar.value).x"
          :y="rowY(index)"
          :width="barRect(bar.value).width"
          :height="barHeight"
          :fill="bar.color"
          rx="3"
          :style="{
            opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.18 : 1,
            transition: 'opacity 0.18s ease',
          }"
        />

        <text
          :x="PAD.left - 8"
          :y="rowY(index) + barHeight / 2 + 4"
          text-anchor="end"
          :fill="hoveredIndex !== null && hoveredIndex !== index ? palette.tooltipMuted : palette.axisText"
          style="font-size: 11px; transition: fill 0.18s ease;"
        >
          {{ bar.label }}
        </text>
      </g>

      <g v-if="hoveredIndex !== null">
        <rect
          :x="tooltipX"
          :y="tooltipY"
          :width="tooltipWidth"
          :height="tooltipHeight"
          rx="6"
          :fill="palette.tooltipBg"
        />
        <rect
          :x="tooltipX"
          :y="tooltipY"
          :width="tooltipWidth"
          :height="tooltipHeight"
          rx="6"
          fill="none"
          :stroke="bars[hoveredIndex].color"
          stroke-width="0.75"
          stroke-opacity="0.45"
        />
        <text
          :x="tooltipX + 10"
          :y="tooltipY + 16"
          :fill="palette.tooltipMuted"
          style="font-size: 10px;"
        >
          {{ bars[hoveredIndex].label }}
        </text>
        <text
          :x="tooltipX + 10"
          :y="tooltipY + 33"
          :fill="bars[hoveredIndex].color"
          style="font-size: 13px; font-weight: 700; font-family: ui-monospace, monospace;"
        >
          {{ formatBarValue(bars[hoveredIndex].value) }}
        </text>
      </g>
    </svg>
  </div>
</template>
