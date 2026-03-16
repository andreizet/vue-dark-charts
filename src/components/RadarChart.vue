<script setup lang="ts">
import { computed, ref, toRef, type CSSProperties } from 'vue'
import { useResize } from '../composables/useResize'
import { useTheme } from '../composables/useTheme'
import type { RadarChartProps } from '../types'
import { formatAxisLabel, formatValue } from '../utils/format'
import { uniqueId } from '../utils/ids'

type RadarPoint = {
  axisIndex: number
  label: string
  value: number
  x: number
  y: number
}

const props = withDefaults(defineProps<RadarChartProps>(), {
  theme: 'dark',
  valueMode: 'number',
  gridLevels: 5,
  showDots: false,
})

const rootRef = ref<HTMLDivElement | null>(null)
const stageRef = ref<HTMLDivElement | null>(null)
const { width: cw, height: ch } = useResize(rootRef)
const { palette } = useTheme(rootRef, toRef(props, 'theme'))

const hoveredIndex = ref<number | null>(null)

const fallbackColors = computed(() => [
  '#2458ff',
  '#a855f7',
  '#f97316',
  '#14b8a6',
  '#f43f5e',
  '#22c55e',
])

const singlePoints = computed(() => props.points ?? [])
const isMultiMode = computed(() => Array.isArray(props.series) && props.series.length > 0)

const normalizedSeries = computed(() => {
  if (isMultiMode.value) {
    return (props.series ?? []).map((series, index) => ({
      ...series,
      color:
        series.color ??
        props.colors?.[index] ??
        fallbackColors.value[index % fallbackColors.value.length],
      fillOpacity: series.fillOpacity ?? (index === 0 ? 0.12 : 0.16),
    }))
  }

  if (!singlePoints.value.length) {
    return []
  }

  return [
    {
      name: 'Series',
      color: props.color ?? fallbackColors.value[0],
      fillOpacity: 0.16,
      points: singlePoints.value,
    },
  ]
})

const labels = computed(() => {
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const safeGridLevels = computed(() => clamp(props.gridLevels, 3, 8))

const maxValue = computed(() => {
  if (typeof props.maxValue === 'number' && props.maxValue > 0) {
    return props.maxValue
  }

  const values = normalizedSeries.value.flatMap((series) => series.points.map((point) => point.y))
  const resolved = Math.max(...values, 0)
  return resolved > 0 ? resolved : 1
})

const centerX = computed(() => cw.value / 2)
const centerY = computed(() => ch.value / 2)

const radius = computed(() => {
  const widthRadius = cw.value / 2 - 62
  const heightRadius = ch.value / 2 - 42
  return Math.max(36, Math.min(widthRadius, heightRadius))
})

function axisAngle(index: number): number {
  return -Math.PI / 2 + (index / Math.max(labels.value.length, 1)) * Math.PI * 2
}

function polarPoint(index: number, distance: number) {
  const angle = axisAngle(index)
  return {
    x: centerX.value + Math.cos(angle) * distance,
    y: centerY.value + Math.sin(angle) * distance,
  }
}

function buildPath(points: Array<{ x: number; y: number }>, closed = false): string {
  if (!points.length) {
    return ''
  }

  const [first, ...rest] = points
  let path = `M ${first.x} ${first.y}`

  for (const point of rest) {
    path += ` L ${point.x} ${point.y}`
  }

  if (closed && points.length > 1) {
    path += ' Z'
  }

  return path
}

const axisLines = computed(() =>
  labels.value.map((label, index) => ({
    label,
    index,
    ...polarPoint(index, radius.value),
  })),
)

const labelPositions = computed(() =>
  labels.value.map((label, index) => {
    const point = polarPoint(index, radius.value + 24)
    const anchor =
      point.x > centerX.value + 14 ? 'start' : point.x < centerX.value - 14 ? 'end' : 'middle'

    return {
      index,
      label: formatAxisLabel(label),
      x: point.x,
      y: point.y,
      anchor,
    }
  }),
)

const gridPolygons = computed(() =>
  Array.from({ length: safeGridLevels.value }, (_, index) => {
    const level = index + 1
    const distance = radius.value * (level / safeGridLevels.value)
    const points = labels.value.map((_, axisIndex) => polarPoint(axisIndex, distance))

    return {
      level,
      path: buildPath(points, true),
    }
  }),
)

const seriesShapes = computed(() =>
  normalizedSeries.value.map((series, seriesIndex) => {
    const valueMap = new Map(series.points.map((point) => [point.x, point.y]))
    const points = labels.value.map((label, axisIndex) => {
      const rawValue = valueMap.get(label) ?? 0
      const boundedValue = clamp(rawValue, 0, maxValue.value)
      const position = polarPoint(axisIndex, radius.value * (boundedValue / maxValue.value))

      return {
        axisIndex,
        label,
        value: rawValue,
        x: position.x,
        y: position.y,
      }
    })

    return {
      ...series,
      seriesIndex,
      path: buildPath(points, true),
      points,
    }
  }),
)

const visiblePoints = computed(() =>
  seriesShapes.value.flatMap((series) =>
    series.points
      .filter((point) => props.showDots || hoveredIndex.value === point.axisIndex)
      .map((point) => ({
        ...point,
        color: series.color,
        active: hoveredIndex.value === point.axisIndex,
      })),
  ),
)

const hoverZones = computed(() => {
  if (!labels.value.length) {
    return []
  }

  const step = (Math.PI * 2) / labels.value.length
  const zoneRadius = radius.value + 22

  return labels.value.map((label, index) => {
    const midAngle = axisAngle(index)
    const previous = midAngle - step / 2
    const next = midAngle + step / 2
    const p1 = {
      x: centerX.value + Math.cos(previous) * zoneRadius,
      y: centerY.value + Math.sin(previous) * zoneRadius,
    }
    const p2 = polarPoint(index, zoneRadius)
    const p3 = {
      x: centerX.value + Math.cos(next) * zoneRadius,
      y: centerY.value + Math.sin(next) * zoneRadius,
    }

    return {
      label,
      index,
      path: buildPath(
        [
          { x: centerX.value, y: centerY.value },
          p1,
          p2,
          p3,
        ],
        true,
      ),
    }
  })
})

const hoverRows = computed(() => {
  if (hoveredIndex.value === null) {
    return []
  }

  const index = hoveredIndex.value

  return seriesShapes.value.map((series) => {
    const point = series.points[index]

    return {
      name: series.name,
      color: series.color,
      value: point?.value ?? 0,
    }
  })
})

const hoverLabel = computed(() =>
  hoveredIndex.value !== null ? labels.value[hoveredIndex.value] ?? '' : '',
)

const hoverAnchor = computed(() => {
  if (hoveredIndex.value === null) {
    return null
  }

  const index = hoveredIndex.value
  const points = seriesShapes.value
    .map((series) => series.points[index])
    .filter((point): point is RadarPoint => Boolean(point))

  if (!points.length) {
    return polarPoint(index, radius.value)
  }

  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  }
})

const tooltipWidth = computed(() => 156)
const tooltipHeight = computed(() => 18 + hoverRows.value.length * 22 + 16)

const tooltipStyle = computed<CSSProperties>(() => {
  const anchor = hoverAnchor.value
  const stageRect = stageRef.value?.getBoundingClientRect()
  if (!anchor || !stageRect) {
    return {}
  }

  const preferredLeft = anchor.x + 14
  const left =
    preferredLeft + tooltipWidth.value > cw.value - 8
      ? anchor.x - tooltipWidth.value - 14
      : preferredLeft
  const top = clamp(anchor.y - tooltipHeight.value / 2, 8, ch.value - tooltipHeight.value - 8)
  const viewportWidth = typeof window === 'undefined' ? 0 : window.innerWidth
  const viewportHeight = typeof window === 'undefined' ? 0 : window.innerHeight
  const fixedLeft = stageRect.left + clamp(left, 8, cw.value - tooltipWidth.value - 8)
  const fixedTop = stageRect.top + top
  const maxLeft = Math.max(8, viewportWidth - tooltipWidth.value - 8)
  const maxTop = Math.max(8, viewportHeight - tooltipHeight.value - 8)

  return {
    position: 'fixed',
    left: `${viewportWidth ? clamp(fixedLeft, 8, maxLeft) : fixedLeft}px`,
    top: `${viewportHeight ? clamp(fixedTop, 8, maxTop) : fixedTop}px`,
    width: `${tooltipWidth.value}px`,
    zIndex: '1000',
  }
})

function formatHoverValue(value: number): string {
  if (props.format) {
    return props.format(value)
  }

  return formatValue(value, props.valueMode)
}

function setHover(index: number) {
  hoveredIndex.value = index
}

function clearHover() {
  hoveredIndex.value = null
}

const pointGlowId = uniqueId('vdc-radar-point-glow')
</script>

<template>
  <div ref="rootRef" class="vdc-root vdc-chart vdc-radar">
    <div v-if="!labels.length" class="vdc-empty">No chart data yet.</div>
    <div
      v-else-if="cw > 0 && ch > 0"
      ref="stageRef"
      class="vdc-radar-stage"
      @mouseleave="clearHover"
    >
      <svg class="vdc-radar-svg" :width="cw" :height="ch" :viewBox="`0 0 ${cw} ${ch}`">
        <defs>
          <filter :id="pointGlowId" x="-250%" y="-250%" width="600%" height="600%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          class="vdc-radar-backdrop"
          :cx="centerX"
          :cy="centerY"
          :r="radius + 8"
          :fill="palette.track"
        />

        <path
          v-for="polygon in gridPolygons"
          :key="polygon.level"
          class="vdc-radar-grid"
          :d="polygon.path"
          :stroke="palette.grid"
        />

        <line
          v-for="axis in axisLines"
          :key="axis.index"
          class="vdc-radar-axis"
          :x1="centerX"
          :y1="centerY"
          :x2="axis.x"
          :y2="axis.y"
          :stroke="palette.grid"
        />

        <path
          v-for="series in seriesShapes"
          :key="`area-${series.seriesIndex}`"
          class="vdc-radar-area"
          :d="series.path"
          :fill="series.color"
          :fill-opacity="series.fillOpacity"
        />

        <path
          v-for="series in seriesShapes"
          :key="`line-${series.seriesIndex}`"
          class="vdc-radar-line"
          :d="series.path"
          :stroke="series.color"
        />

        <circle
          v-for="point in visiblePoints"
          :key="`point-${point.color}-${point.axisIndex}-${point.x}`"
          :cx="point.x"
          :cy="point.y"
          :r="point.active ? 4.5 : 2.5"
          :fill="point.color"
          :filter="point.active ? `url(#${pointGlowId})` : undefined"
          :class="['vdc-radar-point', { 'is-active': point.active }]"
        />

        <circle class="vdc-radar-center-dot" :cx="centerX" :cy="centerY" :r="3" :fill="palette.grid" />

        <text
          v-for="label in labelPositions"
          :key="`label-${label.index}`"
          class="vdc-radar-label"
          :x="label.x"
          :y="label.y"
          :text-anchor="label.anchor"
          :fill="hoveredIndex === label.index ? palette.surfaceText : palette.axisText"
        >
          {{ label.label }}
        </text>

        <path
          v-for="zone in hoverZones"
          :key="`zone-${zone.index}`"
          class="vdc-radar-zone"
          :d="zone.path"
          @mouseenter="setHover(zone.index)"
          @mousemove="setHover(zone.index)"
        />
      </svg>

      <Teleport to="body">
        <div
          v-if="hoveredIndex !== null && hoverRows.length"
          class="vdc-radar-tooltip"
          :style="{
            ...tooltipStyle,
            borderColor: palette.tooltipBorder,
            background: palette.tooltipBg,
            color: palette.tooltipText,
            boxShadow: '0 18px 32px rgba(0, 0, 0, 0.28)',
          }"
        >
          <div class="vdc-radar-tooltip-title">{{ hoverLabel }}</div>
          <div
            v-for="row in hoverRows"
            :key="row.name"
            class="vdc-radar-tooltip-row"
            :style="{ color: palette.tooltipText }"
          >
            <div class="vdc-radar-tooltip-series">
              <span class="vdc-radar-tooltip-swatch" :style="{ backgroundColor: row.color }" />
              <span :style="{ color: palette.tooltipMuted }">{{ row.name }}</span>
            </div>
            <strong>{{ formatHoverValue(row.value) }}</strong>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>
