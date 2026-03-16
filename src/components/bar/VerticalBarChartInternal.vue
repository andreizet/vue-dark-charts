<script setup lang="ts">
import { computed, onUnmounted, ref, toRef, watch, type CSSProperties } from 'vue'
import { useResize } from '../../composables/useResize'
import { useTheme } from '../../composables/useTheme'
import { formatAxisLabel, formatTooltipValue, formatValue } from '../../utils/format'
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

const PAD = { top: 20, right: 12, bottom: 32, left: 12 }
const innerWidth = computed(() => Math.max(1, cw.value - PAD.left - PAD.right))
const innerHeight = computed(() => Math.max(1, ch.value - PAD.top - PAD.bottom))

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

function sy(value: number): number {
  return PAD.top + (1 - (value - minValue.value) / valueRange.value) * innerHeight.value
}

const zeroY = computed(() => sy(0))
const slot = computed(() => innerWidth.value / Math.max(1, labels.value.length))
const groupGapRatio = computed(() => (props.stacked ? 0.46 : 0.28))
const groupWidth = computed(() => Math.max(8, slot.value * (1 - groupGapRatio.value)))
const intraGroupGap = computed(() => Math.min(8, groupWidth.value * 0.12))
const seriesCount = computed(() => Math.max(1, series.value.length))

const groupedBarWidth = computed(() => {
  if (seriesCount.value <= 1) {
    return groupWidth.value
  }

  return Math.max(4, (groupWidth.value - intraGroupGap.value * (seriesCount.value - 1)) / seriesCount.value)
})

const groupedLayoutWidth = computed(() =>
  groupedBarWidth.value * seriesCount.value + intraGroupGap.value * Math.max(seriesCount.value - 1, 0),
)

function groupStartX(index: number): number {
  const targetWidth = props.stacked ? groupWidth.value : groupedLayoutWidth.value
  return PAD.left + index * slot.value + (slot.value - targetWidth) / 2
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

function rectY(value: number): number {
  return value >= 0 ? sy(value) : zeroY.value
}

function rectHeight(value: number): number {
  return Math.max(2, Math.abs(sy(value) - zeroY.value))
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
            x: groupStartX(labelIndex),
            y: sy(nextOffset),
            width: groupWidth.value,
            height: Math.max(2, sy(positiveOffset) - sy(nextOffset)),
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
          x: groupStartX(labelIndex),
          y: sy(negativeOffset),
          width: groupWidth.value,
          height: Math.max(2, sy(nextOffset) - sy(negativeOffset)),
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

      bars.push({
        key: `${label}-${entry.name}-${seriesIndex}`,
        label,
        labelIndex,
        seriesName: entry.name,
        value: bar.value,
        x: groupStartX(labelIndex) + seriesIndex * (groupedBarWidth.value + intraGroupGap.value),
        y: rectY(bar.value),
        width: groupedBarWidth.value,
        height: rectHeight(bar.value),
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
      vector: resolveGradientVector(bar.fill.gradient?.direction, 'vertical'),
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

const labelStep = computed(() => {
  const count = labels.value.length
  if (!count) {
    return 1
  }

  const longestLabel = labels.value.reduce(
    (max, label) => Math.max(max, formatAxisLabel(label).length),
    0,
  )
  const minSpacing = clamp(longestLabel * 6 + 10, 28, 84)
  const maxLabelCount = Math.max(1, Math.floor(innerWidth.value / minSpacing) + 1)

  return Math.max(1, Math.ceil(count / maxLabelCount))
})

function formatHoverValue(value: number): string {
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

function setHoveredIndex(currentTarget: EventTarget | null, clientX: number) {
  const element = currentTarget as SVGElement | null
  if (!element || !labels.value.length) {
    hoveredIndex.value = null
    return
  }

  const rect = element.getBoundingClientRect()
  const scaleX = cw.value / Math.max(rect.width, 1)
  const rawX = (clientX - rect.left) * scaleX - PAD.left

  if (rawX < 0 || rawX > innerWidth.value) {
    hoveredIndex.value = null
    return
  }

  hoveredIndex.value = Math.max(
    0,
    Math.min(labels.value.length - 1, Math.floor(rawX / Math.max(slot.value, 1))),
  )
}

function onMouseMove(event: MouseEvent) {
  setHoveredIndex(event.currentTarget, event.clientX)
}

function onTouchMove(event: TouchEvent) {
  const touch = event.touches[0]
  if (!touch) {
    return
  }

  setHoveredIndex(event.currentTarget, touch.clientX)
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

const hoveredGroupBars = computed(() => {
  if (hoveredIndex.value === null) {
    return []
  }

  return renderBars.value.filter((bar) => bar.labelIndex === hoveredIndex.value)
})

const hoveredGroupMaxY = computed(() => {
  if (!hoveredGroupBars.value.length) {
    return 0
  }

  return Math.min(...hoveredGroupBars.value.map((bar) => bar.y))
})

const hoveredGroupCenterX = computed(() => {
  if (hoveredIndex.value === null) {
    return 0
  }

  return PAD.left + hoveredIndex.value * slot.value + slot.value / 2
})

const tooltipWidth = computed(() => {
  if (!isMultiMode.value || props.stacked) {
    return 220
  }

  return 204
})

const tooltipHeight = computed(() => Math.max(44, 24 + hoverRows.value.length * 16))
const TOOLTIP_SAFE_MARGIN = 8

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const tooltipX = computed(() => {
  const next = hoveredGroupCenterX.value + 12
  return next + tooltipWidth.value > cw.value - PAD.right
    ? hoveredGroupCenterX.value - tooltipWidth.value - 12
    : next
})

const tooltipY = computed(() => Math.max(PAD.top + 4, hoveredGroupMaxY.value - tooltipHeight.value - 10))

const referenceY = ref(0)
const referenceOpacity = ref(0)
const lastHoveredIndex = ref<number | null>(null)
let frame: number | null = null

const singleHoveredBar = computed(() => {
  const index = hoveredIndex.value ?? lastHoveredIndex.value
  if (index === null) {
    return null
  }

  const label = labels.value[index]
  return label ? seriesMaps.value[0]?.get(label) ?? null : null
})

const targetReferenceY = computed(() => (singleHoveredBar.value ? sy(singleHoveredBar.value.value) : 0))
const targetOpacity = computed(() => (hoveredIndex.value === null ? 0 : 1))
const referenceLabel = computed(() =>
  singleHoveredBar.value ? formatAxisValue(singleHoveredBar.value.value) : '',
)
const referenceColor = computed(() => singleHoveredBar.value?.fill.color ?? palette.value.axisText)
const chipWidth = computed(() => Math.max(44, referenceLabel.value.length * 7.5 + 18))

const tooltipStyle = computed<CSSProperties>(() => {
  const rootRect = rootRef.value?.getBoundingClientRect()
  if (!rootRect || !isMultiMode.value || hoveredIndex.value === null || !hoverRows.value.length) {
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
const barGlowId = uniqueId('vdc-bar-vertical-glow')

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

  if (!isMultiMode.value) {
    startAnimation()
  }
})

onUnmounted(() => {
  stopAnimation()
})
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
        :x1="PAD.left"
        :y1="zeroY"
        :x2="cw - PAD.right"
        :y2="zeroY"
        :stroke="palette.zeroLine"
        stroke-width="1"
      />

      <rect
        v-for="(label, index) in labels"
        v-if="props.stacked && isMultiMode"
        :key="`track-${label}`"
        :x="groupStartX(index)"
        :y="PAD.top"
        :width="groupWidth"
        :height="innerHeight"
        :fill="palette.track"
        :style="{
          opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.35 : 0.9,
          transition: 'opacity 0.18s ease',
        }"
        rx="4"
      />

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
          opacity: hoveredIndex !== null && hoveredIndex !== bar.labelIndex ? 0.16 : 1,
          transition: 'opacity 0.18s ease',
        }"
        rx="4"
      />

      <g v-if="!isMultiMode && referenceOpacity > 0.01" :opacity="referenceOpacity">
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
          style="font-size: 11px; font-weight: 600;"
        >
          {{ referenceLabel }}
        </text>
        <line
          :x1="PAD.left + chipWidth + 5"
          :y1="referenceY"
          :x2="cw - PAD.right"
          :y2="referenceY"
          :stroke="palette.zeroLine"
          stroke-dasharray="4 4"
          stroke-width="1"
        />
      </g>

      <text
        v-for="(label, index) in labels"
        v-show="index % labelStep === 0"
        :key="`label-${label}-${index}`"
        :x="PAD.left + index * slot + slot / 2"
        :y="ch - 5"
        text-anchor="middle"
        :fill="palette.axisText"
        style="font-size: 11px;"
      >
        {{ formatAxisLabel(label) }}
      </text>
    </svg>

    <Teleport to="body">
      <div v-if="isMultiMode && hoveredIndex !== null && hoverRows.length" :style="tooltipStyle">
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
            {{ formatHoverValue(row.value) }}
          </span>
        </div>
      </div>
    </Teleport>
  </div>
</template>
