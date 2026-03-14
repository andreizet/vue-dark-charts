<script setup lang="ts">
import { computed, ref, toRef, watch, onUnmounted } from 'vue'
import { useResize } from '../composables/useResize'
import { useTheme } from '../composables/useTheme'
import { formatAxisLabel, formatTooltipValue, formatValue } from '../utils/format'
import { uniqueId } from '../utils/ids'
import type { MultiLineChartProps } from '../types'

const props = withDefaults(defineProps<MultiLineChartProps>(), {
  theme: 'dark',
  valueMode: 'currency',
})

const rootRef = ref<HTMLDivElement | null>(null)
const { width: cw, height: ch } = useResize(rootRef)
const { palette } = useTheme(rootRef, toRef(props, 'theme'))

const fallbackColors = computed(() => [
  palette.value.positive,
  '#38bdf8',
  '#a78bfa',
  '#f97316',
  '#facc15',
  '#f472b6',
])

const normalizedSeries = computed(() =>
  props.series.map((series, index) => ({
    ...series,
    color: series.color ?? fallbackColors.value[index % fallbackColors.value.length],
  })),
)

const PAD = { top: 16, right: 16, bottom: 28, left: 58 }
const innerWidth = computed(() => Math.max(1, cw.value - PAD.left - PAD.right))
const innerHeight = computed(() => Math.max(1, ch.value - PAD.top - PAD.bottom))

const labels = computed(() => {
  const set = new Set<string>()
  for (const series of normalizedSeries.value) {
    for (const point of series.points) {
      set.add(point.x)
    }
  }
  return [...set].sort()
})

const seriesMaps = computed(() =>
  normalizedSeries.value.map((series) => ({
    name: series.name,
    color: series.color,
    values: new Map(series.points.map((point) => [point.x, point.y])),
  })),
)

const allValues = computed(() =>
  seriesMaps.value.flatMap((series) =>
    labels.value
      .map((label) => series.values.get(label))
      .filter((value): value is number => typeof value === 'number'),
  ),
)

const minValue = computed(() => Math.min(0, ...(allValues.value.length ? allValues.value : [0])))
const maxValue = computed(() => Math.max(0, ...(allValues.value.length ? allValues.value : [0])))
const valueRange = computed(() => Math.max(maxValue.value - minValue.value, 0.01))

function sx(index: number): number {
  if (labels.value.length <= 1) {
    return PAD.left + innerWidth.value / 2
  }

  return PAD.left + (index / (labels.value.length - 1)) * innerWidth.value
}

function sy(value: number): number {
  return PAD.top + (1 - (value - minValue.value) / valueRange.value) * innerHeight.value
}

const seriesPaths = computed(() =>
  seriesMaps.value.map((series) => {
    const points = labels.value
      .map((label, index) => {
        const value = series.values.get(label)
        return typeof value === 'number' ? { x: sx(index), y: sy(value) } : null
      })
      .filter((point): point is { x: number; y: number } => point !== null)

    if (!points.length) {
      return { ...series, path: '' }
    }

    if (points.length === 1) {
      return { ...series, path: `M ${points[0].x} ${points[0].y}` }
    }

    let path = `M ${points[0].x} ${points[0].y}`

    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1]
      const current = points[index]
      const controlX = (previous.x + current.x) / 2
      path += ` C ${controlX} ${previous.y}, ${controlX} ${current.y}, ${current.x} ${current.y}`
    }

    return { ...series, path }
  }),
)

const yTicks = computed(() => {
  if (minValue.value === maxValue.value) {
    return [{ value: 0, y: sy(0) }]
  }

  const step = (maxValue.value - minValue.value) / 4
  return Array.from({ length: 5 }, (_, index) => {
    const value = minValue.value + index * step
    return { value, y: sy(value) }
  })
})

const xTicks = computed(() => {
  if (!labels.value.length) {
    return []
  }

  const step = Math.max(1, Math.ceil(labels.value.length / 8))
  const ticks: Array<{ label: string; x: number }> = []

  for (let index = 0; index < labels.value.length; index += step) {
    ticks.push({ label: formatAxisLabel(labels.value[index]), x: sx(index) })
  }

  return ticks
})

function formatChartValue(value: number): string {
  if (props.format) {
    return props.format(value)
  }

  return formatValue(value, props.valueMode)
}

function formatHoverValue(value: number): string {
  if (props.format) {
    return props.format(value)
  }

  return formatTooltipValue(value, props.valueMode)
}

const hoveredIndex = ref<number | null>(null)

function onMouseMove(event: MouseEvent) {
  const element = event.currentTarget as SVGElement | null
  if (!element) {
    return
  }

  const rect = element.getBoundingClientRect()
  const scaleX = cw.value / Math.max(rect.width, 1)
  const rawX = (event.clientX - rect.left) * scaleX - PAD.left

  if (rawX < 0 || rawX > innerWidth.value || !labels.value.length) {
    hoveredIndex.value = null
    return
  }

  hoveredIndex.value = Math.max(
    0,
    Math.min(
      labels.value.length - 1,
      Math.round((rawX / innerWidth.value) * (labels.value.length - 1)),
    ),
  )
}

function onLeave() {
  hoveredIndex.value = null
}

const hoveredX = computed(() => (hoveredIndex.value !== null ? sx(hoveredIndex.value) : 0))
const tooltipWidth = 220
const tooltipX = computed(() => {
  const next = hoveredX.value + 14
  return next + tooltipWidth > cw.value - PAD.right
    ? hoveredX.value - 14 - tooltipWidth
    : next
})

const tooltipY = PAD.top + 8

const hoverRows = computed(() => {
  if (hoveredIndex.value === null) {
    return []
  }

  const label = labels.value[hoveredIndex.value]
  if (!label) {
    return []
  }

  return seriesMaps.value
    .map((series) => ({
      name: series.name,
      color: series.color,
      value: series.values.get(label),
    }))
    .filter((row): row is { name: string; color: string; value: number } => typeof row.value === 'number')
})

const hoverLabel = computed(() =>
  hoveredIndex.value !== null ? labels.value[hoveredIndex.value] ?? '' : '',
)

const animX = ref(0)
const animTooltipX = ref(0)
const animOpacity = ref(0)
let frame: number | null = null

function stopAnimation() {
  if (frame !== null) {
    cancelAnimationFrame(frame)
    frame = null
  }
}

function startAnimation() {
  const fromX = animX.value
  const fromTooltipX = animTooltipX.value
  const fromOpacity = animOpacity.value
  const toX = hoveredX.value
  const toTooltipX = tooltipX.value
  const toOpacity = hoveredIndex.value === null ? 0 : 1
  const duration = hoveredIndex.value === null ? 240 : 320
  const startedAt = performance.now()

  stopAnimation()

  const step = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / duration)
    const eased = progress * progress
    animX.value = fromX + (toX - fromX) * eased
    animTooltipX.value = fromTooltipX + (toTooltipX - fromTooltipX) * eased
    animOpacity.value = fromOpacity + (toOpacity - fromOpacity) * eased

    if (progress >= 1) {
      frame = null
      return
    }

    frame = requestAnimationFrame(step)
  }

  frame = requestAnimationFrame(step)
}

watch(hoveredIndex, () => {
  startAnimation()
})

onUnmounted(() => {
  stopAnimation()
})

const dotGlowId = uniqueId('vdc-multi-dot')
</script>

<template>
  <div ref="rootRef" class="vdc-root vdc-chart">
    <div v-if="!normalizedSeries.length" class="vdc-empty">No chart data yet.</div>
    <svg
      v-else-if="cw > 0 && ch > 0"
      :width="cw"
      :height="ch"
      style="display: block; overflow: visible;"
      @mousemove="onMouseMove"
      @mouseleave="onLeave"
    >
      <defs>
        <filter :id="dotGlowId" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <line
        v-for="tick in yTicks"
        :key="tick.value"
        :x1="PAD.left"
        :y1="tick.y"
        :x2="cw - PAD.right"
        :y2="tick.y"
        :stroke="palette.grid"
        stroke-width="1"
      />

      <line
        :x1="PAD.left"
        :y1="sy(0)"
        :x2="cw - PAD.right"
        :y2="sy(0)"
        :stroke="palette.zeroLine"
        stroke-width="1"
        stroke-dasharray="4 4"
      />

      <path
        v-for="seriesPath in seriesPaths"
        :key="seriesPath.name"
        :d="seriesPath.path"
        fill="none"
        :stroke="seriesPath.color"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <text
        v-for="tick in yTicks"
        :key="`y-${tick.value}`"
        :x="PAD.left - 8"
        :y="tick.y + 4"
        text-anchor="end"
        :fill="palette.axisText"
        style="font-size: 11px; font-family: ui-monospace, monospace;"
      >
        {{ formatChartValue(tick.value) }}
      </text>

      <text
        v-for="tick in xTicks"
        :key="`x-${tick.label}-${tick.x}`"
        :x="tick.x"
        :y="ch - 4"
        text-anchor="middle"
        :fill="palette.axisText"
        style="font-size: 11px;"
      >
        {{ tick.label }}
      </text>

      <template v-if="hoveredIndex !== null || animOpacity > 0.02">
        <line
          :x1="animX"
          :y1="PAD.top"
          :x2="animX"
          :y2="ch - PAD.bottom"
          :stroke="palette.zeroLine"
          stroke-width="1"
          :opacity="animOpacity"
        />

        <template v-if="hoveredIndex !== null">
          <circle
            v-for="row in hoverRows"
            :key="`row-${row.name}`"
            :cx="sx(hoveredIndex)"
            :cy="sy(row.value)"
            r="4"
            :fill="row.color"
            :filter="`url(#${dotGlowId})`"
            :opacity="animOpacity"
          />
        </template>

        <g :transform="`translate(${animTooltipX}, ${tooltipY})`" :opacity="animOpacity">
          <rect
            :width="tooltipWidth"
            :height="Math.max(44, 24 + hoverRows.length * 16)"
            rx="6"
            :fill="palette.tooltipBg"
          />
          <rect
            :width="tooltipWidth"
            :height="Math.max(44, 24 + hoverRows.length * 16)"
            rx="6"
            fill="none"
            :stroke="palette.tooltipBorder"
            stroke-width="0.75"
          />
          <text
            x="10"
            y="16"
            :fill="palette.tooltipMuted"
            style="font-size: 10px;"
          >
            {{ hoverLabel }}
          </text>
          <text
            v-for="(row, index) in hoverRows"
            :key="`${row.name}-${index}`"
            x="10"
            :y="32 + index * 16"
            :fill="row.color"
            style="font-size: 12px; font-weight: 700; font-family: ui-monospace, monospace;"
          >
            {{ row.name }}: {{ formatHoverValue(row.value) }}
          </text>
        </g>
      </template>
    </svg>
  </div>
</template>
