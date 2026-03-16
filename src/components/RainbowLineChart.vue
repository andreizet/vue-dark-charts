<script setup lang="ts">
import { computed, ref, toRef, watch, onUnmounted, type CSSProperties } from 'vue'
import { useResize } from '../composables/useResize'
import { useTheme } from '../composables/useTheme'
import { formatTooltipValue, formatValue } from '../utils/format'
import { uniqueId } from '../utils/ids'
import type { RainbowLineChartProps } from '../types'

const props = withDefaults(defineProps<RainbowLineChartProps>(), {
  theme: 'dark',
  dotted: false,
  showZeroLine: true,
  smooth: true,
})

const rootRef = ref<HTMLDivElement | null>(null)
const { width: cw, height: ch } = useResize(rootRef)
const { palette } = useTheme(rootRef, toRef(props, 'theme'))
const positiveColor = computed(() => props.positiveColor ?? palette.value.positive)
const negativeColor = computed(() => props.negativeColor ?? palette.value.negative)

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
    if (props.smooth) {
      const controlX = (previousX + currentX) / 2
      path += ` C ${controlX} ${previousY}, ${controlX} ${currentY}, ${currentX} ${currentY}`
      continue
    }

    path += ` L ${currentX} ${currentY}`
  }

  return path
})

const zeroY = computed(() => sy(0))
const lineStrokeDasharray = computed(() => (props.dotted ? '6 6' : undefined))

const zeroOffset = computed(() => {
  if (minValue.value >= 0) {
    return 100
  }
  if (maxValue.value <= 0) {
    return 0
  }
  return (maxValue.value / (maxValue.value - minValue.value)) * 100
})

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
    ticks.push({ label: props.points[index].x, x: sx(index) })
  }

  return ticks
})

function formatChartValue(value: number): string {
  if (props.format) {
    return props.format(value)
  }
  return formatValue(value, 'currency')
}

function formatHoverValue(value: number): string {
  if (props.format) {
    return props.format(value)
  }
  return formatTooltipValue(value, 'currency')
}

const hoveredIndex = ref<number | null>(null)

function onMouseMove(event: MouseEvent) {
  const element = event.currentTarget as SVGElement | null
  if (!element) {
    return
  }

  const rect = element.getBoundingClientRect()
  const rawX = (event.clientX - rect.left) * (cw.value / Math.max(rect.width, 1)) - PAD.left

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

function onLeave() {
  hoveredIndex.value = null
}

const hoveredX = computed(() => (hoveredIndex.value !== null ? sx(hoveredIndex.value) : 0))
const hoveredY = computed(() =>
  hoveredIndex.value !== null ? sy(props.points[hoveredIndex.value].y) : 0,
)
const hoveredValue = computed(() =>
  hoveredIndex.value !== null ? props.points[hoveredIndex.value].y : 0,
)
const hoveredColor = computed(() =>
  hoveredValue.value >= 0 ? positiveColor.value : negativeColor.value,
)

const tooltipWidth = 148
const tooltipHeight = 44
const TOOLTIP_SAFE_MARGIN = 8

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

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
  const duration = hoveredIndex.value === null ? 240 : 300
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
    frame = progress < 1 ? requestAnimationFrame(step) : null
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

const displayedPoint = computed(() => {
  const index = hoveredIndex.value ?? lastHoveredIndex.value
  if (index === null || !props.points[index]) {
    return null
  }

  return props.points[index]
})

const tooltipStyle = computed<CSSProperties>(() => {
  const rootRect = rootRef.value?.getBoundingClientRect()
  if (!rootRect || !displayedPoint.value) {
    return {}
  }

  const viewportWidth = typeof window === 'undefined' ? 0 : window.innerWidth
  const viewportHeight = typeof window === 'undefined' ? 0 : window.innerHeight
  const maxLeft = Math.max(TOOLTIP_SAFE_MARGIN, viewportWidth - tooltipWidth - TOOLTIP_SAFE_MARGIN)
  const maxTop = Math.max(TOOLTIP_SAFE_MARGIN, viewportHeight - tooltipHeight - TOOLTIP_SAFE_MARGIN)

  return {
    position: 'fixed',
    left: `${viewportWidth ? clamp(rootRect.left + animTooltipX.value, TOOLTIP_SAFE_MARGIN, maxLeft) : rootRect.left + animTooltipX.value}px`,
    top: `${viewportHeight ? clamp(rootRect.top + animTooltipY.value, TOOLTIP_SAFE_MARGIN, maxTop) : rootRect.top + animTooltipY.value}px`,
    width: `${tooltipWidth}px`,
    padding: '0.45rem 0.65rem',
    borderRadius: '6px',
    border: `1px solid ${hoveredColor.value}`,
    background: palette.value.tooltipBg,
    color: palette.value.tooltipText,
    boxShadow: '0 16px 30px rgba(0, 0, 0, 0.22)',
    pointerEvents: 'none',
    zIndex: '1000',
  }
})

const gradientId = uniqueId('vdc-rainbow-gradient')
const dotGlowId = uniqueId('vdc-rainbow-dot')
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
    >
      <defs>
        <linearGradient
          :id="gradientId"
          x1="0"
          :y1="PAD.top"
          x2="0"
          :y2="PAD.top + innerHeight"
          gradientUnits="userSpaceOnUse"
        >
          <template v-if="zeroOffset >= 100">
            <stop offset="0%" :stop-color="positiveColor" />
            <stop offset="100%" :stop-color="positiveColor" stop-opacity="0.6" />
          </template>
          <template v-else-if="zeroOffset <= 0">
            <stop offset="0%" :stop-color="negativeColor" stop-opacity="0.6" />
            <stop offset="100%" :stop-color="negativeColor" />
          </template>
          <template v-else>
            <stop offset="0%" :stop-color="positiveColor" />
            <stop :offset="`${Math.max(0, zeroOffset - 4)}%`" :stop-color="positiveColor" />
            <stop :offset="`${Math.min(100, zeroOffset + 4)}%`" :stop-color="negativeColor" />
            <stop offset="100%" :stop-color="negativeColor" />
          </template>
        </linearGradient>

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

      <path
        :d="linePath"
        fill="none"
        :stroke="`url(#${gradientId})`"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        :stroke-dasharray="lineStrokeDasharray"
      />

      <text
        v-for="tick in yTicks"
        :key="`y-${tick.value}`"
        :x="PAD.left - 8"
        :y="tick.y + 4"
        text-anchor="end"
        :fill="palette.axisText"
        style="font-size: 11px;"
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

      <template v-if="(hoveredIndex !== null || animOpacity > 0.02) && displayedPoint">
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
          :fill="hoveredColor"
          :filter="`url(#${dotGlowId})`"
          :opacity="animOpacity"
        />
        <circle :cx="animX" :cy="animY" r="3" :fill="hoveredColor" :opacity="animOpacity" />
        <circle :cx="animX" :cy="animY" r="1.5" fill="#ffffff" :opacity="0.9 * animOpacity" />
      </template>
    </svg>

    <Teleport to="body">
      <div
        v-if="(hoveredIndex !== null || animOpacity > 0.02) && displayedPoint"
        :style="{
          ...tooltipStyle,
          opacity: `${animOpacity}`,
        }"
      >
        <div :style="{ color: palette.tooltipMuted, fontSize: '10px' }">{{ displayedPoint.x }}</div>
        <div
          :style="{
            color: hoveredColor,
            fontSize: '13px',
            fontWeight: '700',
            marginTop: '0.2rem',
          }"
        >
          {{ formatHoverValue(displayedPoint.y) }}
        </div>
      </div>
    </Teleport>
  </div>
</template>
