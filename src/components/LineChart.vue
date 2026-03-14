<script setup lang="ts">
import { computed, ref, toRef, watch, onUnmounted } from 'vue'
import { useResize } from '../composables/useResize'
import { useTheme } from '../composables/useTheme'
import { formatAxisLabel, formatTooltipValue, formatValue } from '../utils/format'
import { uniqueId } from '../utils/ids'
import type { LineChartProps } from '../types'

const props = withDefaults(defineProps<LineChartProps>(), {
  theme: 'dark',
  valueMode: 'currency',
})

const rootRef = ref<HTMLDivElement | null>(null)
const { width: cw, height: ch } = useResize(rootRef)
const { palette } = useTheme(rootRef, toRef(props, 'theme'))

const color = computed(() => props.color ?? palette.value.positive)

const PAD = { top: 16, right: 16, bottom: 28, left: 58 }
const innerWidth = computed(() => Math.max(1, cw.value - PAD.left - PAD.right))
const innerHeight = computed(() => Math.max(1, ch.value - PAD.top - PAD.bottom))

const minValue = computed(() => Math.min(0, ...props.points.map((point) => point.y)))
const maxValue = computed(() => Math.max(0, ...props.points.map((point) => point.y)))
const valueRange = computed(() => Math.max(maxValue.value - minValue.value, 0.01))

function sx(index: number): number {
  if (props.points.length <= 1) {
    return PAD.left + innerWidth.value / 2
  }

  return PAD.left + (index / (props.points.length - 1)) * innerWidth.value
}

function sy(value: number): number {
  return PAD.top + (1 - (value - minValue.value) / valueRange.value) * innerHeight.value
}

const linePath = computed(() => {
  if (!props.points.length) {
    return ''
  }

  if (props.points.length === 1) {
    return `M ${sx(0)} ${sy(props.points[0].y)}`
  }

  let path = `M ${sx(0)} ${sy(props.points[0].y)}`

  for (let index = 1; index < props.points.length; index += 1) {
    const previousX = sx(index - 1)
    const previousY = sy(props.points[index - 1].y)
    const currentX = sx(index)
    const currentY = sy(props.points[index].y)
    const controlX = (previousX + currentX) / 2
    path += ` C ${controlX} ${previousY}, ${controlX} ${currentY}, ${currentX} ${currentY}`
  }

  return path
})

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
  if (!props.points.length) {
    return []
  }

  const step = Math.max(1, Math.ceil(props.points.length / 8))
  const ticks: Array<{ label: string; x: number }> = []

  for (let index = 0; index < props.points.length; index += step) {
    ticks.push({ label: formatAxisLabel(props.points[index].x), x: sx(index) })
  }

  return ticks
})

function formatYAxis(value: number): string {
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

  if (rawX < 0 || rawX > innerWidth.value || !props.points.length) {
    hoveredIndex.value = null
    return
  }

  hoveredIndex.value = Math.max(
    0,
    Math.min(
      props.points.length - 1,
      Math.round((rawX / innerWidth.value) * (props.points.length - 1)),
    ),
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
  hoveredIndex.value !== null ? sy(props.points[hoveredIndex.value].y) : 0,
)

const tooltipWidth = 148
const tooltipHeight = 44

const tooltipX = computed(() => {
  const next = hoveredX.value + 14
  return next + tooltipWidth > cw.value - PAD.right
    ? hoveredX.value - 14 - tooltipWidth
    : next
})

const tooltipY = computed(() =>
  Math.max(
    PAD.top,
    Math.min(hoveredY.value - tooltipHeight / 2, ch.value - PAD.bottom - tooltipHeight),
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
  const toY = hoveredY.value
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
  if (value !== null) {
    lastHoveredIndex.value = value
    if (previous === null) {
      animX.value = hoveredX.value
      animY.value = hoveredY.value
      animTooltipX.value = tooltipX.value
      animTooltipY.value = tooltipY.value
    }
  }

  startAnimation()
})

onUnmounted(() => {
  stopAnimation()
})

const showHover = computed(() => hoveredIndex.value !== null || animOpacity.value > 0.02)
const displayedPoint = computed(() => {
  const index = hoveredIndex.value ?? lastHoveredIndex.value
  if (index === null || !props.points[index]) {
    return null
  }

  return props.points[index]
})

const glowId = uniqueId('vdc-line-glow')
const dotGlowId = uniqueId('vdc-line-dot')
</script>

<template>
  <div ref="rootRef" class="vdc-root vdc-chart">
    <div v-if="!props.points.length" class="vdc-empty">No chart data yet.</div>
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
        :x1="PAD.left"
        :y1="zeroY"
        :x2="cw - PAD.right"
        :y2="zeroY"
        :stroke="palette.zeroLine"
        stroke-width="1"
        stroke-dasharray="4 4"
      />

      <path
        :d="linePath"
        fill="none"
        :stroke="color"
        stroke-width="2"
        :filter="`url(#${glowId})`"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <circle
        v-if="props.points.length === 1"
        :cx="sx(0)"
        :cy="sy(props.points[0].y)"
        r="4"
        :fill="color"
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
        {{ formatYAxis(tick.value) }}
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

      <template v-if="showHover && displayedPoint">
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
          :fill="color"
          :filter="`url(#${dotGlowId})`"
          :opacity="animOpacity"
        />
        <circle :cx="animX" :cy="animY" r="3" :fill="color" :opacity="animOpacity" />
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
            :stroke="color"
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
            :fill="color"
            style="font-size: 13px; font-weight: 700; font-family: ui-monospace, monospace;"
          >
            {{ formatHoverValue(displayedPoint.y) }}
          </text>
        </g>
      </template>
    </svg>
  </div>
</template>
