<script setup lang="ts">
import { computed, reactive, ref, toRef, type CSSProperties } from 'vue'
import { useResize } from '../composables/useResize'
import { useTheme } from '../composables/useTheme'
import type { DonutChartProps, DonutSegment } from '../types'

const props = withDefaults(defineProps<DonutChartProps>(), {
  theme: 'dark',
  neon: true,
})

const emit = defineEmits<{
  'segment-click': [segment: DonutSegment]
}>()

const rootRef = ref<HTMLDivElement | null>(null)
const { width: rootWidth } = useResize(rootRef)
const { palette } = useTheme(rootRef, toRef(props, 'theme'))

const hiddenSegments = reactive(new Set<number>())
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

const allSegments = computed(() =>
  props.segments
    .map((segment, index) => ({
      ...segment,
      color: segment.color ?? fallbackColors.value[index % fallbackColors.value.length],
    }))
    .filter((segment) => segment.value > 0)
    .sort((left, right) => right.value - left.value),
)

const visibleSegments = computed(() =>
  allSegments.value.filter((_, index) => !hiddenSegments.has(index)),
)

const visibleTotal = computed(() =>
  visibleSegments.value.reduce((total, segment) => total + segment.value, 0),
)

const total = computed(() =>
  allSegments.value.reduce((sum, segment) => sum + segment.value, 0),
)

const CX = 120
const CY = 120
const OUTER_RADIUS = 100
const INNER_RADIUS = 55
const GAP_DEGREES = 3
const CORNER_RADIUS = 6
const VIEWBOX_SIZE = CX * 2

function polarToCartesian(radius: number, angleDeg: number) {
  const radians = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: CX + radius * Math.cos(radians),
    y: CY + radius * Math.sin(radians),
  }
}

function buildArcPath(startDeg: number, endDeg: number): string {
  const cornerInset = Math.min(CORNER_RADIUS * 0.8, (endDeg - startDeg) / 4)
  const innerStartDeg = startDeg + cornerInset
  const innerEndDeg = endDeg - cornerInset

  const outerStart = polarToCartesian(OUTER_RADIUS, innerStartDeg)
  const outerEnd = polarToCartesian(OUTER_RADIUS, innerEndDeg)
  const innerStart = polarToCartesian(INNER_RADIUS, innerEndDeg)
  const innerEnd = polarToCartesian(INNER_RADIUS, innerStartDeg)
  const trueOuterEnd = polarToCartesian(OUTER_RADIUS, endDeg)
  const trueInnerEnd = polarToCartesian(INNER_RADIUS, startDeg)
  const largeArc = innerEndDeg - innerStartDeg > 180 ? 1 : 0

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `Q ${trueOuterEnd.x} ${trueOuterEnd.y} ${innerStart.x} ${innerStart.y}`,
    `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    `Q ${trueInnerEnd.x} ${trueInnerEnd.y} ${outerStart.x} ${outerStart.y}`,
    'Z',
  ].join(' ')
}

const arcs = computed(() => {
  const source = allSegments.value
    .map((segment, index) => ({ segment, index }))
    .filter(({ index }) => !hiddenSegments.has(index))

  const currentTotal = source.reduce((sum, item) => sum + item.segment.value, 0)
  if (!currentTotal) {
    return []
  }

  const totalGap = GAP_DEGREES * source.length
  const availableDegrees = 360 - totalGap
  let currentAngle = 0

  return source.flatMap(({ segment, index }) => {
    const sweep = (segment.value / currentTotal) * availableDegrees
    if (sweep < 0.5) {
      currentAngle += sweep + GAP_DEGREES
      return []
    }

    const startAngle = currentAngle
    const endAngle = currentAngle + sweep
    const midAngle = (startAngle + endAngle) / 2
    currentAngle = endAngle + GAP_DEGREES

    return [
      {
        index,
        path: buildArcPath(startAngle, endAngle),
        color: segment.color,
        midAngle,
      },
    ]
  })
})

const hoveredSegment = computed(() =>
  hoveredIndex.value !== null ? allSegments.value[hoveredIndex.value] : null,
)

const compactLayout = computed(() => rootWidth.value > 0 && rootWidth.value < 440)
const chartSize = computed(() => {
  if (!rootWidth.value) {
    return VIEWBOX_SIZE
  }

  const available = compactLayout.value ? rootWidth.value - 24 : rootWidth.value * 0.46
  return clamp(Math.round(available), 120, VIEWBOX_SIZE)
})

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

function formatValue(value: number): string {
  if (props.format) {
    return props.format(value)
  }

  return value.toLocaleString('en-US')
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function toggleSegment(index: number) {
  if (!hiddenSegments.has(index)) {
    if (hiddenSegments.size >= allSegments.value.length - 1) {
      return
    }
    hiddenSegments.add(index)
    return
  }

  hiddenSegments.delete(index)
}

function onArcMove(event: MouseEvent, index: number) {
  hoveredIndex.value = index
  tooltip.value = {
    x: event.clientX,
    y: event.clientY,
    visible: true,
  }
}

function onArcLeave() {
  hoveredIndex.value = null
  tooltip.value.visible = false
}

function onLegendEnter(index: number) {
  if (!hiddenSegments.has(index)) {
    hoveredIndex.value = index
  }
}

function onLegendLeave() {
  hoveredIndex.value = null
}

function onSegmentClick(index: number) {
  const segment = allSegments.value[index]
  if (!segment) {
    return
  }

  emit('segment-click', segment)
  toggleSegment(index)
}
</script>

<template>
  <div ref="rootRef" class="vdc-root vdc-chart">
    <div v-if="!allSegments.length" class="vdc-empty">No chart data yet.</div>
    <div v-else :class="['vdc-donut', { 'is-compact': compactLayout }]">
      <div class="vdc-donut-canvas" :style="{ width: `${chartSize}px` }">
        <svg :width="chartSize" :height="chartSize" :viewBox="`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`">
          <defs>
            <filter
              v-for="arc in arcs"
              :id="`vdc-donut-glow-${arc.index}`"
              :key="`glow-${arc.index}`"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <path
            v-for="arc in arcs"
            :key="arc.index"
            :d="arc.path"
            :fill="arc.color"
            :opacity="hoveredIndex === null || hoveredIndex === arc.index ? 1 : 0.35"
            :filter="props.neon ? `url(#vdc-donut-glow-${arc.index})` : undefined"
            :transform="
              hoveredIndex === arc.index
                ? `translate(${Math.cos((arc.midAngle - 90) * Math.PI / 180) * 4}, ${Math.sin((arc.midAngle - 90) * Math.PI / 180) * 4})`
                : undefined
            "
            style="cursor: pointer; transition: opacity 0.2s ease, transform 0.2s ease;"
            @mousemove="onArcMove($event, arc.index)"
            @mouseleave="onArcLeave"
            @click="onSegmentClick(arc.index)"
          />

          <text
            :x="CX"
            :y="CY - 6"
            text-anchor="middle"
            :fill="palette.surfaceText"
            style="font-size: 28px; font-weight: 700;"
          >
            {{ props.centerText ?? formatValue(visibleTotal) }}
          </text>
          <text
            :x="CX"
            :y="CY + 14"
            text-anchor="middle"
            :fill="palette.axisText"
            style="font-size: 11px;"
          >
            total
          </text>
        </svg>

        <Teleport to="body">
          <div v-if="tooltip.visible && hoveredSegment" :style="tooltipStyle">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span
                :style="{
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '999px',
                  backgroundColor: hoveredSegment.color,
                  display: 'inline-block',
                }"
              />
              <span style="font-weight: 600;">{{ hoveredSegment.label }}</span>
            </div>
            <div :style="{ marginTop: '0.2rem', color: palette.tooltipMuted }">
              {{ formatValue(hoveredSegment.value) }} ·
              {{ total ? ((hoveredSegment.value / total) * 100).toFixed(1) : '0.0' }}%
            </div>
          </div>
        </Teleport>
      </div>

      <div class="vdc-donut-legend">
        <div
          v-for="(segment, index) in allSegments"
          :key="segment.label"
          class="vdc-donut-item"
          :class="{
            'is-hidden': hiddenSegments.has(index),
            'is-active': hoveredIndex === index && !hiddenSegments.has(index),
          }"
          @click="toggleSegment(index)"
          @mouseenter="onLegendEnter(index)"
          @mouseleave="onLegendLeave"
        >
          <span
            class="vdc-donut-swatch"
            :style="{ backgroundColor: segment.color, opacity: hiddenSegments.has(index) ? 0.4 : 1 }"
          />
          <span
            class="vdc-donut-label"
            :style="{
              color: hiddenSegments.has(index) ? palette.tooltipMuted : palette.surfaceText,
              textDecoration: hiddenSegments.has(index) ? 'line-through' : 'none',
            }"
          >
            {{ segment.label }}
          </span>
          <span class="vdc-donut-value">
            {{ formatValue(segment.value) }}
            ({{ total ? ((segment.value / total) * 100).toFixed(0) : '0' }}%)
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
