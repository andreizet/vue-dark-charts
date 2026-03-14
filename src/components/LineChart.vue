<script setup lang="ts">
import { computed, onUnmounted, ref, toRef, watch } from 'vue'
import { useResize } from '../composables/useResize'
import { useTheme } from '../composables/useTheme'
import { formatAxisLabel, formatTooltipValue, formatValue } from '../utils/format'
import { uniqueId } from '../utils/ids'
import type { LineChartProps } from '../types'

const props = withDefaults(defineProps<LineChartProps>(), {
  theme: 'dark',
  valueMode: 'currency',
  dotted: false,
  showZeroLine: true,
  smooth: true,
})

const rootRef = ref<HTMLDivElement | null>(null)
const { width: cw, height: ch } = useResize(rootRef)
const { palette } = useTheme(rootRef, toRef(props, 'theme'))

const singlePoints = computed(() => props.points ?? [])
const isMultiMode = computed(() => Array.isArray(props.series))
const singleColor = computed(() => props.color ?? palette.value.positive)

const fallbackColors = computed(() => [
  palette.value.positive,
  '#38bdf8',
  '#a78bfa',
  '#f97316',
  '#facc15',
  '#f472b6',
])

const normalizedSeries = computed(() => {
  if (isMultiMode.value) {
    return (props.series ?? []).map((series, index) => ({
      ...series,
      color:
        series.color ??
        props.colors?.[index] ??
        fallbackColors.value[index % fallbackColors.value.length],
    }))
  }

  return [
    {
      name: 'Series',
      color: singleColor.value,
      points: singlePoints.value,
    },
  ]
})

const PAD = { top: 16, right: 16, bottom: 28, left: 58 }
const innerWidth = computed(() => Math.max(1, cw.value - PAD.left - PAD.right))
const innerHeight = computed(() => Math.max(1, ch.value - PAD.top - PAD.bottom))

const labels = computed(() => {
  if (!isMultiMode.value) {
    return singlePoints.value.map((point) => point.x)
  }

  const seen = new Set<string>()
  const ordered: string[] = []

  for (const series of normalizedSeries.value) {
    for (const point of series.points) {
      if (!seen.has(point.x)) {
        seen.add(point.x)
        ordered.push(point.x)
      }
    }
  }

  return ordered
})

const allValues = computed(() =>
  normalizedSeries.value.flatMap((series) => series.points.map((point) => point.y)),
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

function resolveStrokeDasharray(dotted?: boolean): string | undefined {
  return (dotted ?? props.dotted) ? '6 6' : undefined
}

const seriesPaths = computed(() =>
  normalizedSeries.value.map((series) => {
    const points = isMultiMode.value
      ? labels.value
          .map((label, index) => {
            const value = series.points.find((point) => point.x === label)?.y
            return typeof value === 'number' ? { x: sx(index), y: sy(value) } : null
          })
          .filter((point): point is { x: number; y: number } => point !== null)
      : series.points.map((point, index) => ({ x: sx(index), y: sy(point.y) }))

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
      if (props.smooth) {
        const controlX = (previous.x + current.x) / 2
        path += ` C ${controlX} ${previous.y}, ${controlX} ${current.y}, ${current.x} ${current.y}`
        continue
      }

      path += ` L ${current.x} ${current.y}`
    }

    return { ...series, path }
  }),
)

const zeroY = computed(() => sy(0))

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

function setHoverFromClientX(currentTarget: EventTarget | null, clientX: number) {
  const element = currentTarget as SVGElement | null
  if (!element) {
    return
  }

  const rect = element.getBoundingClientRect()
  const scaleX = cw.value / Math.max(rect.width, 1)
  const rawX = (clientX - rect.left) * scaleX - PAD.left

  if (rawX < 0 || rawX > innerWidth.value || !labels.value.length) {
    hoveredIndex.value = null
    return
  }

  hoveredIndex.value = Math.max(
    0,
    Math.min(labels.value.length - 1, Math.round((rawX / innerWidth.value) * (labels.value.length - 1))),
  )
}

function onMouseMove(event: MouseEvent) {
  setHoverFromClientX(event.currentTarget, event.clientX)
}

function onTouchMove(event: TouchEvent) {
  const touch = event.touches[0]
  if (!touch) {
    return
  }

  setHoverFromClientX(event.currentTarget, touch.clientX)
}

function onLeave() {
  hoveredIndex.value = null
}

const hoveredX = computed(() => (hoveredIndex.value !== null ? sx(hoveredIndex.value) : 0))
const hoveredY = computed(() =>
  hoveredIndex.value !== null && singlePoints.value[hoveredIndex.value]
    ? sy(singlePoints.value[hoveredIndex.value].y)
    : 0,
)

const hoverRows = computed(() => {
  if (!isMultiMode.value || hoveredIndex.value === null) {
    return []
  }

  const label = labels.value[hoveredIndex.value]
  if (!label) {
    return []
  }

  return normalizedSeries.value
    .map((series) => ({
      name: series.name,
      color: series.color,
      value: series.points.find((point) => point.x === label)?.y,
    }))
    .filter((row): row is { name: string; color: string; value: number } => typeof row.value === 'number')
})

const hoverLabel = computed(() =>
  hoveredIndex.value !== null ? labels.value[hoveredIndex.value] ?? '' : '',
)

const tooltipWidth = computed(() => (isMultiMode.value ? 220 : 148))
const tooltipHeight = computed(() =>
  isMultiMode.value ? Math.max(44, 24 + hoverRows.value.length * 16) : 44,
)

const tooltipX = computed(() => {
  const next = hoveredX.value + 14
  return next + tooltipWidth.value > cw.value - PAD.right
    ? hoveredX.value - 14 - tooltipWidth.value
    : next
})

const tooltipY = computed(() =>
  isMultiMode.value
    ? PAD.top + 8
    : Math.max(
        PAD.top,
        Math.min(hoveredY.value - tooltipHeight.value / 2, ch.value - PAD.bottom - tooltipHeight.value),
      ),
)

const animX = ref(0)
const animY = ref(0)
const animTooltipX = ref(0)
const animTooltipY = ref(0)
const animOpacity = ref(0)
const lastHoveredIndex = ref<number | null>(null)

let frame: number | null = null

function stopAnimation() {
  if (frame !== null) {
    cancelAnimationFrame(frame)
    frame = null
  }
}

function startAnimation() {
  const fromX = animX.value
  const fromY = animY.value
  const fromTooltipX = animTooltipX.value
  const fromTooltipY = animTooltipY.value
  const fromOpacity = animOpacity.value

  const toX = hoveredX.value
  const toY = isMultiMode.value ? fromY : hoveredY.value
  const toTooltipX = tooltipX.value
  const toTooltipY = tooltipY.value
  const toOpacity = hoveredIndex.value === null ? 0 : 1
  const duration = hoveredIndex.value === null ? 220 : 300
  const startedAt = performance.now()

  stopAnimation()

  const step = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / duration)
    const eased = progress * progress

    animX.value = fromX + (toX - fromX) * eased
    animY.value = fromY + (toY - fromY) * eased
    animTooltipX.value = fromTooltipX + (toTooltipX - fromTooltipX) * eased
    animTooltipY.value = fromTooltipY + (toTooltipY - fromTooltipY) * eased
    animOpacity.value = fromOpacity + (toOpacity - fromOpacity) * eased

    if (progress >= 1) {
      frame = null
      return
    }

    frame = requestAnimationFrame(step)
  }

  frame = requestAnimationFrame(step)
}

watch(hoveredIndex, (value, previous) => {
  if (!isMultiMode.value && value !== null) {
    lastHoveredIndex.value = value
  }

  if (value !== null && previous === null) {
    animX.value = hoveredX.value
    animTooltipX.value = tooltipX.value
    animTooltipY.value = tooltipY.value

    if (!isMultiMode.value) {
      animY.value = hoveredY.value
    }
  }

  startAnimation()
})

onUnmounted(() => {
  stopAnimation()
})

const showHover = computed(() => hoveredIndex.value !== null || animOpacity.value > 0.02)
const displayedPoint = computed(() => {
  if (isMultiMode.value) {
    return null
  }

  const index = hoveredIndex.value ?? lastHoveredIndex.value
  if (index === null || !singlePoints.value[index]) {
    return null
  }

  return singlePoints.value[index]
})

const singleSeriesPath = computed(() => seriesPaths.value[0]?.path ?? '')
const glowId = uniqueId('vdc-line-glow')
const dotGlowId = uniqueId('vdc-line-dot')
</script>

<template>
  <div ref="rootRef" class="vdc-root vdc-chart">
    <div v-if="!labels.length" class="vdc-empty">No chart data yet.</div>
    <svg
      v-else-if="cw > 0 && ch > 0"
      :width="cw"
      :height="ch"
      style="display: block; overflow: visible;"
      @mousemove="onMouseMove"
      @mouseleave="onLeave"
      @touchmove.prevent="onTouchMove"
      @touchend="onLeave"
    >
      <defs>
        <filter :id="glowId" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feComponentTransfer in="blur" result="dimBlur">
            <feFuncA type="linear" slope="0.35" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="dimBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter :id="dotGlowId" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
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
        v-if="props.showZeroLine"
        :x1="PAD.left"
        :y1="zeroY"
        :x2="cw - PAD.right"
        :y2="zeroY"
        :stroke="palette.zeroLine"
        stroke-width="1"
        stroke-dasharray="4 4"
      />

      <template v-if="isMultiMode">
        <path
          v-for="seriesPath in seriesPaths"
          :key="seriesPath.name"
          :d="seriesPath.path"
          fill="none"
          :stroke="seriesPath.color"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          :stroke-dasharray="resolveStrokeDasharray(seriesPath.dotted)"
        />
      </template>
      <template v-else>
        <path
          :d="singleSeriesPath"
          fill="none"
          :stroke="singleColor"
          stroke-width="2"
          :filter="`url(#${glowId})`"
          stroke-linecap="round"
          stroke-linejoin="round"
          :stroke-dasharray="resolveStrokeDasharray()"
        />

        <circle
          v-if="singlePoints.length === 1"
          :cx="sx(0)"
          :cy="sy(singlePoints[0].y)"
          r="4"
          :fill="singleColor"
        />
      </template>

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

      <template v-if="!isMultiMode && showHover && displayedPoint">
        <line
          :x1="animX"
          :y1="PAD.top"
          :x2="animX"
          :y2="ch - PAD.bottom"
          :stroke="palette.zeroLine"
          stroke-width="1"
          :opacity="animOpacity"
        />

        <circle
          :cx="animX"
          :cy="animY"
          r="5"
          :fill="singleColor"
          :filter="`url(#${dotGlowId})`"
          :opacity="animOpacity"
        />
        <circle :cx="animX" :cy="animY" r="3" :fill="singleColor" :opacity="animOpacity" />
        <circle :cx="animX" :cy="animY" r="1.5" fill="#ffffff" :opacity="0.92 * animOpacity" />

        <g :transform="`translate(${animTooltipX}, ${animTooltipY})`" :opacity="animOpacity">
          <rect
            :width="tooltipWidth"
            :height="tooltipHeight"
            rx="6"
            :fill="palette.tooltipBg"
          />
          <rect
            :width="tooltipWidth"
            :height="tooltipHeight"
            rx="6"
            fill="none"
            :stroke="singleColor"
            stroke-width="0.75"
            stroke-opacity="0.4"
          />
          <text
            x="10"
            y="16"
            :fill="palette.tooltipMuted"
            style="font-size: 10px;"
          >
            {{ displayedPoint.x }}
          </text>
          <text
            x="10"
            y="33"
            :fill="singleColor"
            style="font-size: 13px; font-weight: 700; font-family: ui-monospace, monospace;"
          >
            {{ formatHoverValue(displayedPoint.y) }}
          </text>
        </g>
      </template>

      <template v-if="isMultiMode && showHover">
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

        <g :transform="`translate(${animTooltipX}, ${animTooltipY})`" :opacity="animOpacity">
          <rect
            :width="tooltipWidth"
            :height="tooltipHeight"
            rx="6"
            :fill="palette.tooltipBg"
          />
          <rect
            :width="tooltipWidth"
            :height="tooltipHeight"
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
