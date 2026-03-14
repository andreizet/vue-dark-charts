<script setup lang="ts">
import { computed, ref, toRef, watch, onUnmounted } from 'vue'
import { useResize } from '../composables/useResize'
import { useTheme } from '../composables/useTheme'
import { formatTooltipValue, formatValue } from '../utils/format'
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

const PAD = { top: 24, right: 8, bottom: 28, left: 8 }
const innerWidth = computed(() => Math.max(1, cw.value - PAD.left - PAD.right))
const innerHeight = computed(() => Math.max(1, ch.value - PAD.top - PAD.bottom))

const minValue = computed(() => Math.min(0, ...bars.value.map((bar) => bar.value)))
const maxValue = computed(() => Math.max(0, ...bars.value.map((bar) => bar.value)))
const valueRange = computed(() => Math.max(maxValue.value - minValue.value, 0.01))

function sy(value: number): number {
  return PAD.top + (1 - (value - minValue.value) / valueRange.value) * innerHeight.value
}

const zeroY = computed(() => sy(0))

const gap = 0.3
const slot = computed(() => innerWidth.value / Math.max(1, bars.value.length))
const barWidth = computed(() => Math.max(1, slot.value * (1 - gap)))

function bx(index: number): number {
  return PAD.left + index * slot.value + (slot.value * gap) / 2
}

function by(value: number): number {
  return value >= 0 ? sy(value) : zeroY.value
}

function bh(value: number): number {
  return Math.max(2, Math.abs(sy(value) - zeroY.value))
}

const labelStep = computed(() => {
  const count = bars.value.length
  if (count <= 12) {
    return 1
  }
  if (count <= 20) {
    return 2
  }
  return Math.ceil(count / 10)
})

function formatBarValue(value: number): string {
  if (props.format) {
    return props.format(value)
  }

  return formatTooltipValue(value, props.valueMode)
}

function formatAxisValue(value: number): string {
  if (props.format) {
    return props.format(value)
  }

  return formatValue(value, props.valueMode)
}

const hoveredIndex = ref<number | null>(null)
const referenceY = ref(0)
const referenceOpacity = ref(0)
const lastHoveredIndex = ref<number | null>(null)
let frame: number | null = null

function onMouseMove(event: MouseEvent) {
  const element = event.currentTarget as SVGElement | null
  if (!element) {
    return
  }

  const rect = element.getBoundingClientRect()
  const x = (event.clientX - rect.left) * (cw.value / Math.max(rect.width, 1)) - PAD.left
  const index = Math.floor(x / slot.value)
  hoveredIndex.value = index >= 0 && index < bars.value.length ? index : null
}

function onLeave() {
  hoveredIndex.value = null
}

const targetReferenceY = computed(() => {
  const index = hoveredIndex.value ?? lastHoveredIndex.value
  if (index === null || !bars.value[index]) {
    return 0
  }

  return sy(bars.value[index].value)
})

const targetOpacity = computed(() => (hoveredIndex.value === null ? 0 : 1))

const referenceLabel = computed(() => {
  const index = lastHoveredIndex.value
  if (index === null || !bars.value[index]) {
    return ''
  }

  return formatAxisValue(bars.value[index].value)
})

const referenceColor = computed(() => {
  const index = lastHoveredIndex.value
  if (index === null || !bars.value[index]) {
    return palette.value.axisText
  }

  return bars.value[index].color
})

const chipWidth = computed(() => Math.max(44, referenceLabel.value.length * 7.5 + 18))

function stopAnimation() {
  if (frame !== null) {
    cancelAnimationFrame(frame)
    frame = null
  }
}

function startAnimation() {
  const fromY = referenceY.value
  const fromOpacity = referenceOpacity.value
  const toY = targetReferenceY.value
  const toOpacity = targetOpacity.value
  const startedAt = performance.now()
  const duration = 180

  stopAnimation()

  const step = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / duration)
    const eased =
      progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress
    referenceY.value = fromY + (toY - fromY) * eased
    referenceOpacity.value = fromOpacity + (toOpacity - fromOpacity) * eased
    frame = progress < 1 ? requestAnimationFrame(step) : null
  }

  frame = requestAnimationFrame(step)
}

watch(hoveredIndex, (value) => {
  if (value !== null) {
    lastHoveredIndex.value = value
  }
  startAnimation()
})

onUnmounted(() => {
  stopAnimation()
})
</script>

<template>
  <div ref="rootRef" class="vdc-root vdc-chart">
    <div v-if="!bars.length" class="vdc-empty">No chart data yet.</div>
    <svg
      v-else-if="cw > 0 && ch > 0"
      :width="cw"
      :height="ch"
      style="display: block;"
      @mousemove="onMouseMove"
      @mouseleave="onLeave"
    >
      <line
        v-if="minValue < 0"
        :x1="PAD.left"
        :y1="zeroY"
        :x2="cw - PAD.right"
        :y2="zeroY"
        :stroke="palette.zeroLine"
        stroke-width="1"
      />

      <rect
        v-for="(bar, index) in bars"
        :key="`${bar.label}-${index}`"
        :x="bx(index)"
        :y="by(bar.value)"
        :width="barWidth"
        :height="bh(bar.value)"
        :fill="bar.color"
        rx="2"
        :style="{
          opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.16 : 1,
          transition: 'opacity 0.18s ease',
        }"
      />

      <g v-if="referenceOpacity > 0.01" :opacity="referenceOpacity">
        <rect
          :x="PAD.left"
          :y="referenceY - 11"
          :width="chipWidth"
          height="22"
          rx="4"
          :fill="palette.tooltipBg"
          :stroke="referenceColor"
          stroke-width="0.75"
          stroke-opacity="0.5"
        />
        <text
          :x="PAD.left + chipWidth / 2"
          :y="referenceY + 4.5"
          text-anchor="middle"
          :fill="referenceColor"
          style="font-size: 11px; font-weight: 600; font-family: ui-monospace, monospace;"
        >
          {{ referenceLabel }}
        </text>
        <line
          :x1="PAD.left + chipWidth + 5"
          :y1="referenceY"
          :x2="cw - PAD.right"
          :y2="referenceY"
          :stroke="palette.zeroLine"
          stroke-width="1"
          stroke-dasharray="4 4"
        />
      </g>

      <text
        v-for="(bar, index) in bars"
        v-show="index % labelStep === 0"
        :key="`label-${bar.label}-${index}`"
        :x="bx(index) + barWidth / 2"
        :y="ch - 4"
        text-anchor="middle"
        :fill="palette.axisText"
        style="font-size: 11px;"
      >
        {{ bar.label }}
      </text>
    </svg>
  </div>
</template>
