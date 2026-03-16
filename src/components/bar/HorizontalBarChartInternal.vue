<script setup lang="ts">
import { computed, ref, toRef, type CSSProperties } from 'vue'
import { useResize } from '../../composables/useResize'
import { useTheme } from '../../composables/useTheme'
import { formatTooltipValue } from '../../utils/format'
import { uniqueId } from '../../utils/ids'
import { normalizeBarChartData, resolveGradientVector, type ResolvedBarFill } from '../../utils/barChart'
import type { BarChartProps, BarGradientStop } from '../../types'

type RenderBar = {
  key: string
  label: string
  labelIndex: number
  seriesName: string
  value: number
  x: number
  y: number
  width: number
  height: number
  fill: ResolvedBarFill
}

const props = withDefaults(defineProps<BarChartProps>(), {
  theme: 'dark',
  valueMode: 'currency',
  stacked: false,
  neon: true,
})

const rootRef = ref<HTMLDivElement | null>(null)
const { width: cw, height: ch } = useResize(rootRef)
const { palette } = useTheme(rootRef, toRef(props, 'theme'))

const normalized = computed(() =>
  normalizeBarChartData(props, {
    positive: palette.value.positive,
    negative: palette.value.negative,
  }),
)

const labels = computed(() => normalized.value.labels)
const series = computed(() => normalized.value.series)
const isMultiMode = computed(() => normalized.value.isMultiMode)
const seriesMaps = computed(() =>
  series.value.map((entry) => new Map(entry.bars.map((bar) => [bar.label, bar]))),
)

const labelWidth = computed(() => {
  const longest = labels.value.reduce((max, label) => Math.max(max, label.length), 0)
  return Math.min(96, Math.max(52, longest * 7 + 14))
})

const PAD = computed(() => ({
  top: 10,
  right: 10,
  bottom: 10,
  left: labelWidth.value,
}))

const innerWidth = computed(() => Math.max(1, cw.value - PAD.value.left - PAD.value.right))
const innerHeight = computed(() => Math.max(1, ch.value - PAD.value.top - PAD.value.bottom))

const allValues = computed(() => {
  if (!props.stacked || !isMultiMode.value) {
    return series.value.flatMap((entry) => entry.bars.map((bar) => bar.value))
  }

  return labels.value.flatMap((label) => {
    let positiveTotal = 0
    let negativeTotal = 0

    for (const entry of seriesMaps.value) {
      const bar = entry.get(label)
      if (!bar) {
        continue
      }

      if (bar.value >= 0) {
        positiveTotal += bar.value
      } else {
        negativeTotal += bar.value
      }
    }

    return [positiveTotal, negativeTotal]
  })
})

const minValue = computed(() => Math.min(0, ...(allValues.value.length ? allValues.value : [0])))
const maxValue = computed(() => Math.max(0, ...(allValues.value.length ? allValues.value : [0])))
const valueRange = computed(() => Math.max(maxValue.value - minValue.value, 0.01))

function bx(value: number): number {
  return PAD.value.left + ((value - minValue.value) / valueRange.value) * innerWidth.value
}

const zeroX = computed(() => bx(0))
const rowHeight = computed(() => innerHeight.value / Math.max(1, labels.value.length))
const trackFillRatio = computed(() => (props.stacked ? 0.44 : isMultiMode.value ? 0.7 : 0.52))
const trackHeight = computed(() => Math.max(6, rowHeight.value * trackFillRatio.value))
const intraRowGap = computed(() => Math.min(6, trackHeight.value * 0.14))
const seriesCount = computed(() => Math.max(1, series.value.length))

const groupedBarHeight = computed(() => {
  if (props.stacked || seriesCount.value <= 1) {
    return trackHeight.value
  }

  return Math.max(4, (trackHeight.value - intraRowGap.value * (seriesCount.value - 1)) / seriesCount.value)
})

function rowStartY(index: number): number {
  return PAD.value.top + index * rowHeight.value + (rowHeight.value - trackHeight.value) / 2
}

function fillStops(fill: ResolvedBarFill): BarGradientStop[] {
  if (fill.gradient?.stops?.length) {
    return fill.gradient.stops
  }

  if (!fill.gradient) {
    return []
  }

  return [
    { offset: '0%', color: fill.gradient.from ?? fill.color },
    { offset: '100%', color: fill.gradient.to ?? fill.gradient.from ?? fill.color },
  ]
}

function horizontalRect(value: number) {
  const valueX = bx(value)

  return {
    x: Math.min(valueX, zeroX.value),
    width: Math.max(2, Math.abs(valueX - zeroX.value)),
  }
}

const renderBars = computed<RenderBar[]>(() => {
  const bars: RenderBar[] = []

  labels.value.forEach((label, labelIndex) => {
    if (props.stacked && isMultiMode.value) {
      let positiveOffset = 0
      let negativeOffset = 0

      series.value.forEach((entry, seriesIndex) => {
        const bar = seriesMaps.value[seriesIndex]?.get(label)
        if (!bar) {
          return
        }

        if (bar.value >= 0) {
          const nextOffset = positiveOffset + bar.value
          bars.push({
            key: `${label}-${entry.name}-${seriesIndex}`,
            label,
            labelIndex,
            seriesName: entry.name,
            value: bar.value,
            x: bx(positiveOffset),
            y: rowStartY(labelIndex),
            width: Math.max(2, bx(nextOffset) - bx(positiveOffset)),
            height: trackHeight.value,
            fill: bar.fill,
          })
          positiveOffset = nextOffset
          return
        }

        const nextOffset = negativeOffset + bar.value
        bars.push({
          key: `${label}-${entry.name}-${seriesIndex}`,
          label,
          labelIndex,
          seriesName: entry.name,
          value: bar.value,
          x: bx(nextOffset),
          y: rowStartY(labelIndex),
          width: Math.max(2, bx(negativeOffset) - bx(nextOffset)),
          height: trackHeight.value,
          fill: bar.fill,
        })
        negativeOffset = nextOffset
      })

      return
    }

    series.value.forEach((entry, seriesIndex) => {
      const bar = seriesMaps.value[seriesIndex]?.get(label)
      if (!bar) {
        return
      }

      const rect = horizontalRect(bar.value)
      bars.push({
        key: `${label}-${entry.name}-${seriesIndex}`,
        label,
        labelIndex,
        seriesName: entry.name,
        value: bar.value,
        x: rect.x,
        y: rowStartY(labelIndex) + seriesIndex * (groupedBarHeight.value + intraRowGap.value),
        width: rect.width,
        height: groupedBarHeight.value,
        fill: bar.fill,
      })
    })
  })

  return bars
})

const gradientBaseId = uniqueId('vdc-bar-gradient')
const fillDefs = computed(() =>
  renderBars.value
    .filter((bar) => bar.fill.gradient)
    .map((bar, index) => ({
      key: bar.key,
      id: `${gradientBaseId}-${index}`,
      vector: resolveGradientVector(bar.fill.gradient?.direction, 'horizontal'),
      stops: fillStops(bar.fill).map((stop) => ({
        ...stop,
        offset: typeof stop.offset === 'number' ? `${stop.offset}%` : stop.offset,
      })),
    })),
)

const fillIdByKey = computed(() => {
  const ids = new Map<string, string>()

  for (const def of fillDefs.value) {
    ids.set(def.key, def.id)
  }

  return ids
})

function resolveFill(bar: RenderBar): string {
  return fillIdByKey.value.has(bar.key) ? `url(#${fillIdByKey.value.get(bar.key)})` : bar.fill.color
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
  const y = (event.clientY - rect.top) * scaleY - PAD.value.top
  const index = Math.floor(y / Math.max(rowHeight.value, 1))
  hoveredIndex.value = index >= 0 && index < labels.value.length ? index : null
}

function onTouchMove(event: TouchEvent) {
  const touch = event.touches[0]
  const element = event.currentTarget as SVGElement | null
  if (!touch || !element) {
    return
  }

  const rect = element.getBoundingClientRect()
  const scaleY = ch.value / Math.max(rect.height, 1)
  const scaleX = cw.value / Math.max(rect.width, 1)

  mouseX.value = (touch.clientX - rect.left) * scaleX
  const y = (touch.clientY - rect.top) * scaleY - PAD.value.top
  const index = Math.floor(y / Math.max(rowHeight.value, 1))
  hoveredIndex.value = index >= 0 && index < labels.value.length ? index : null
}

function onLeave() {
  hoveredIndex.value = null
}

const hoverLabel = computed(() =>
  hoveredIndex.value !== null ? labels.value[hoveredIndex.value] ?? '' : '',
)

const hoverRows = computed(() => {
  if (hoveredIndex.value === null) {
    return []
  }

  const label = labels.value[hoveredIndex.value]
  if (!label) {
    return []
  }

  return series.value
    .map((entry, seriesIndex) => {
      const bar = seriesMaps.value[seriesIndex]?.get(label)
      if (!bar) {
        return null
      }

      return {
        name: entry.name,
        value: bar.value,
        color: bar.fill.color,
      }
    })
    .filter((row): row is { name: string; value: number; color: string } => row !== null)
})

const tooltipWidth = computed(() => (isMultiMode.value ? 220 : 140))
const tooltipHeight = computed(() => Math.max(44, 24 + hoverRows.value.length * 16))
const TOOLTIP_SAFE_MARGIN = 8

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const tooltipX = computed(() => {
  const next = mouseX.value + 14
  return next + tooltipWidth.value > cw.value - PAD.value.right
    ? mouseX.value - 14 - tooltipWidth.value
    : next
})

const tooltipY = computed(() => {
  if (hoveredIndex.value === null) {
    return 0
  }

  const currentRowY = rowStartY(hoveredIndex.value)
  const above = currentRowY - tooltipHeight.value - 8
  return above >= PAD.value.top ? above : currentRowY + trackHeight.value + 8
})

const tooltipStyle = computed<CSSProperties>(() => {
  const rootRect = rootRef.value?.getBoundingClientRect()
  if (!rootRect || hoveredIndex.value === null || !hoverRows.value.length) {
    return {}
  }

  const viewportWidth = typeof window === 'undefined' ? 0 : window.innerWidth
  const viewportHeight = typeof window === 'undefined' ? 0 : window.innerHeight
  const maxLeft = Math.max(
    TOOLTIP_SAFE_MARGIN,
    viewportWidth - tooltipWidth.value - TOOLTIP_SAFE_MARGIN,
  )
  const maxTop = Math.max(
    TOOLTIP_SAFE_MARGIN,
    viewportHeight - tooltipHeight.value - TOOLTIP_SAFE_MARGIN,
  )

  return {
    position: 'fixed',
    left: `${viewportWidth ? clamp(rootRect.left + tooltipX.value, TOOLTIP_SAFE_MARGIN, maxLeft) : rootRect.left + tooltipX.value}px`,
    top: `${viewportHeight ? clamp(rootRect.top + tooltipY.value, TOOLTIP_SAFE_MARGIN, maxTop) : rootRect.top + tooltipY.value}px`,
    width: `${tooltipWidth.value}px`,
    padding: '0.55rem 0.7rem',
    borderRadius: '8px',
    border: `1px solid ${palette.value.tooltipBorder}`,
    background: palette.value.tooltipBg,
    color: palette.value.tooltipText,
    boxShadow: '0 16px 30px rgba(0, 0, 0, 0.22)',
    pointerEvents: 'none',
    zIndex: '1000',
  }
})
const barGlowId = uniqueId('vdc-bar-horizontal-glow')
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
      @touchmove.prevent="onTouchMove"
      @mouseleave="onLeave"
      @touchend="onLeave"
    >
      <defs>
        <filter :id="barGlowId" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feComponentTransfer in="blur" result="dimBlur">
            <feFuncA type="linear" slope="0.26" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="dimBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient
          v-for="def in fillDefs"
          :id="def.id"
          :key="def.id"
          :x1="def.vector.x1"
          :y1="def.vector.y1"
          :x2="def.vector.x2"
          :y2="def.vector.y2"
        >
          <stop
            v-for="(stop, stopIndex) in def.stops"
            :key="`${def.id}-${stopIndex}`"
            :offset="stop.offset"
            :stop-color="stop.color"
            :stop-opacity="stop.opacity ?? 1"
          />
        </linearGradient>
      </defs>

      <line
        v-if="minValue < 0"
        :x1="zeroX"
        :y1="PAD.top"
        :x2="zeroX"
        :y2="ch - PAD.bottom"
        :stroke="palette.zeroLine"
        stroke-width="1"
      />

      <template v-if="props.stacked || !isMultiMode">
        <rect
          v-for="(label, index) in labels"
          :key="`track-${label}`"
          :x="PAD.left"
          :y="rowStartY(index)"
          :width="innerWidth"
          :height="trackHeight"
          rx="4"
          :fill="palette.track"
          :style="{
            opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.35 : 1,
            transition: 'opacity 0.18s ease',
          }"
        />
      </template>

      <template v-else>
        <rect
          v-for="bar in renderBars"
          :key="`track-${bar.key}`"
          :x="PAD.left"
          :y="bar.y"
          :width="innerWidth"
          :height="bar.height"
          rx="4"
          :fill="palette.track"
          :style="{
            opacity: hoveredIndex !== null && hoveredIndex !== bar.labelIndex ? 0.35 : 1,
            transition: 'opacity 0.18s ease',
          }"
        />
      </template>

      <rect
        v-for="bar in renderBars"
        :key="bar.key"
        :x="bar.x"
        :y="bar.y"
        :width="bar.width"
        :height="bar.height"
        :fill="resolveFill(bar)"
        :filter="props.neon ? `url(#${barGlowId})` : undefined"
        :style="{
          opacity: hoveredIndex !== null && hoveredIndex !== bar.labelIndex ? 0.18 : 1,
          transition: 'opacity 0.18s ease',
        }"
        rx="4"
      />

      <text
        v-for="(label, index) in labels"
        :key="`label-${label}-${index}`"
        :x="PAD.left - 8"
        :y="rowStartY(index) + trackHeight / 2 + 4"
        text-anchor="end"
        :fill="hoveredIndex !== null && hoveredIndex !== index ? palette.tooltipMuted : palette.axisText"
        style="font-size: 11px; transition: fill 0.18s ease;"
      >
        {{ label }}
      </text>

    </svg>

    <Teleport to="body">
      <div v-if="hoveredIndex !== null && hoverRows.length" :style="tooltipStyle">
        <div :style="{ color: palette.tooltipMuted, fontSize: '10px' }">{{ hoverLabel }}</div>
        <div
          v-for="(row, rowIndex) in hoverRows"
          :key="`${hoverLabel}-${row.name}`"
          :style="{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.6rem',
            marginTop: rowIndex === 0 ? '0.45rem' : '0.2rem',
            fontSize: '11px',
          }"
        >
          <div :style="{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: '0' }">
            <span
              :style="{
                width: '0.4rem',
                height: '0.4rem',
                borderRadius: '999px',
                background: row.color,
                flexShrink: '0',
              }"
            />
            <span :style="{ color: palette.tooltipText }">{{ row.name }}</span>
          </div>
          <span
            :style="{ color: row.color, fontWeight: '700' }"
          >
            {{ formatBarValue(row.value) }}
          </span>
        </div>
      </div>
    </Teleport>
  </div>
</template>
