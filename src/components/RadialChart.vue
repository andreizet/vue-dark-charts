<script setup lang="ts">
import { computed, ref, toRef, type CSSProperties } from 'vue'
import { useResize } from '../composables/useResize'
import { useTheme } from '../composables/useTheme'
import type { RadialChartProps, RadialRing } from '../types'

const props = withDefaults(defineProps<RadialChartProps>(), {
  theme: 'dark',
  centerLabel: 'progress',
  startAngle: 135,
  ringGap: 8,
  neon: true,
})

const emit = defineEmits<{
  'ring-click': [ring: RadialRing]
}>()

const rootRef = ref<HTMLDivElement | null>(null)
const { width: rootWidth, height: rootHeight } = useResize(rootRef)
const { palette } = useTheme(rootRef, toRef(props, 'theme'))

const hoveredIndex = ref<number | null>(null)
const tooltip = ref({
  x: 0,
  y: 0,
  visible: false,
})

const TOOLTIP_OFFSET = 12
const TOOLTIP_MAX_WIDTH = 240
const TOOLTIP_SAFE_MARGIN = 12

const fallbackColors = computed(() => [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#14b8a6',
  '#ef4444',
  '#84cc16',
])

const SIZE = 260
const CX = SIZE / 2
const CY = SIZE / 2
const OUTER_RADIUS = 94
const INNER_RADIUS = 34

const renderSize = computed(() => {
  const width = rootWidth.value || SIZE
  const height = rootHeight.value || SIZE
  const available = Math.min(width, height)
  return clamp(Math.round(available), 140, SIZE)
})

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const tooltipStyle = computed<CSSProperties>(() => {
  if (!tooltip.value.visible) {
    return {}
  }

  const viewportWidth = typeof window === 'undefined' ? 0 : window.innerWidth
  const viewportHeight = typeof window === 'undefined' ? 0 : window.innerHeight
  const halfWidth = TOOLTIP_MAX_WIDTH / 2
  const minLeft = halfWidth + TOOLTIP_SAFE_MARGIN
  const maxLeft = Math.max(minLeft, viewportWidth - halfWidth - TOOLTIP_SAFE_MARGIN)
  const left = viewportWidth
    ? clamp(tooltip.value.x, minLeft, maxLeft)
    : tooltip.value.x
  const top = viewportHeight
    ? clamp(tooltip.value.y, TOOLTIP_OFFSET + 44, viewportHeight - TOOLTIP_SAFE_MARGIN)
    : tooltip.value.y

  return {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    transform: `translate(-50%, calc(-100% - ${TOOLTIP_OFFSET}px))`,
    pointerEvents: 'none',
    zIndex: '1000',
    maxWidth: `${TOOLTIP_MAX_WIDTH}px`,
    padding: '0.55rem 0.75rem',
    borderRadius: '12px',
    border: `1px solid ${palette.value.tooltipBorder}`,
    background: palette.value.tooltipBg,
    color: palette.value.tooltipText,
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.18)',
    fontSize: '0.75rem',
  }
})

const strokeWidth = computed(() => {
  const count = Math.max(props.rings.length, 1)
  const available = OUTER_RADIUS - INNER_RADIUS
  const width = (available - props.ringGap * (count - 1)) / count
  return clamp(width, 8, 18)
})

const rings = computed(() => {
  return props.rings
    .map((ring, index) => {
      const max = ring.max ?? 100
      const safeMax = max > 0 ? max : 100
      const ratio = clamp(ring.value / safeMax, 0, 1)
      const radius = OUTER_RADIUS - strokeWidth.value / 2 - index * (strokeWidth.value + props.ringGap)
      const circumference = 2 * Math.PI * radius

      return {
        ...ring,
        index,
        max: safeMax,
        ratio,
        radius,
        circumference,
        dasharray: `${circumference * ratio} ${circumference}`,
        color: ring.color ?? fallbackColors.value[index % fallbackColors.value.length],
        rotate: `rotate(${props.startAngle - 90} ${CX} ${CY})`,
      }
    })
    .filter((ring) => ring.radius > INNER_RADIUS / 2)
})

const hoveredRing = computed(() => {
  if (hoveredIndex.value === null) {
    return null
  }

  return rings.value.find((ring) => ring.index === hoveredIndex.value) ?? null
})

function formatValue(value: number): string {
  if (props.format) {
    return props.format(value)
  }

  return value.toLocaleString('en-US')
}

function onRingMove(event: MouseEvent, index: number) {
  hoveredIndex.value = index
  tooltip.value = {
    x: event.clientX,
    y: event.clientY,
    visible: true,
  }
}

function onRingLeave() {
  hoveredIndex.value = null
  tooltip.value.visible = false
}

function onRingClick(index: number) {
  const ring = rings.value.find((entry) => entry.index === index)
  if (!ring) {
    return
  }

  emit('ring-click', ring)
}
</script>

<template>
  <div ref="rootRef" class="vdc-root vdc-chart">
    <div v-if="!rings.length" class="vdc-empty">No chart data yet.</div>
    <div v-else class="vdc-radial">
      <div class="vdc-radial-canvas" :style="{ width: `${renderSize}px`, height: `${renderSize}px` }">
        <svg :width="renderSize" :height="renderSize" :viewBox="`0 0 ${SIZE} ${SIZE}`">
          <defs>
            <filter
              v-for="ring in rings"
              :id="`vdc-radial-glow-${ring.index}`"
              :key="`glow-${ring.index}`"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <circle
            v-for="ring in rings"
            :key="`track-${ring.index}`"
            class="vdc-radial-track"
            :cx="CX"
            :cy="CY"
            :r="ring.radius"
            :stroke="palette.track"
            :stroke-width="strokeWidth"
          />

          <circle
            v-for="ring in rings"
            :key="ring.index"
            class="vdc-radial-arc"
            :cx="CX"
            :cy="CY"
            :r="ring.radius"
            :stroke="ring.color"
            :stroke-width="strokeWidth"
            :stroke-dasharray="ring.dasharray"
            :transform="ring.rotate"
            :opacity="hoveredIndex === null || hoveredIndex === ring.index ? 1 : 0.3"
            :filter="props.neon ? `url(#vdc-radial-glow-${ring.index})` : undefined"
            @mousemove="onRingMove($event, ring.index)"
            @mouseleave="onRingLeave"
            @click="onRingClick(ring.index)"
          />

          <circle
            class="vdc-radial-core"
            :cx="CX"
            :cy="CY"
            :r="Math.max(INNER_RADIUS - 10, 18)"
            :fill="palette.surface"
          />

          <template v-if="props.centerText">
            <text
              :x="CX"
              :y="CY - 4"
              text-anchor="middle"
              :fill="palette.surfaceText"
              style="font-size: 24px; font-weight: 700;"
            >
              {{ props.centerText }}
            </text>
            <text
              :x="CX"
              :y="CY + 16"
              text-anchor="middle"
              :fill="palette.axisText"
              style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em;"
            >
              {{ props.centerLabel }}
            </text>
          </template>
        </svg>

        <Teleport to="body">
          <div v-if="tooltip.visible && hoveredRing" :style="tooltipStyle">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span
                :style="{
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '999px',
                  backgroundColor: hoveredRing.color,
                  display: 'inline-block',
                }"
              />
              <span style="font-weight: 600;">{{ hoveredRing.label }}</span>
            </div>
            <div :style="{ marginTop: '0.2rem', color: palette.tooltipMuted }">
              {{ formatValue(hoveredRing.value) }} / {{ formatValue(hoveredRing.max) }} ·
              {{ (hoveredRing.ratio * 100).toFixed(0) }}%
            </div>
          </div>
        </Teleport>
      </div>
    </div>
  </div>
</template>
