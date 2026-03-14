import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watchEffect,
  type ComputedRef,
  type Ref,
} from 'vue'
import type { ChartTheme } from '../types'

type ThemePalette = {
  tooltipBg: string
  tooltipText: string
  tooltipMuted: string
  tooltipBorder: string
  grid: string
  zeroLine: string
  axisText: string
  track: string
  surface: string
  surfaceText: string
  positive: string
  negative: string
  emptyText: string
}

const DARK_PALETTE: ThemePalette = {
  tooltipBg: '#111113',
  tooltipText: '#e5e7eb',
  tooltipMuted: '#8a8f98',
  tooltipBorder: 'rgba(255,255,255,0.18)',
  grid: 'rgba(255,255,255,0.06)',
  zeroLine: 'rgba(255,255,255,0.18)',
  axisText: 'rgba(255,255,255,0.35)',
  track: 'rgba(255,255,255,0.08)',
  surface: '#0f1117',
  surfaceText: '#f8fafc',
  positive: '#22c55e',
  negative: '#ef4444',
  emptyText: 'rgba(255,255,255,0.48)',
}

const LIGHT_PALETTE: ThemePalette = {
  tooltipBg: '#ffffff',
  tooltipText: '#18181b',
  tooltipMuted: '#6b7280',
  tooltipBorder: 'rgba(24,24,27,0.14)',
  grid: 'rgba(15,23,42,0.08)',
  zeroLine: 'rgba(15,23,42,0.18)',
  axisText: 'rgba(15,23,42,0.42)',
  track: 'rgba(15,23,42,0.08)',
  surface: '#f8fafc',
  surfaceText: '#0f172a',
  positive: '#16a34a',
  negative: '#dc2626',
  emptyText: 'rgba(15,23,42,0.52)',
}

export function useTheme(
  root: Ref<HTMLElement | null>,
  theme: Ref<ChartTheme | undefined>,
): {
  resolvedTheme: ComputedRef<'dark' | 'light'>
  palette: ComputedRef<ThemePalette>
} {
  const preferred = ref<'dark' | 'light'>('dark')
  let query: MediaQueryList | null = null
  let listener: ((event: MediaQueryListEvent) => void) | null = null

  const resolvedTheme = computed<'dark' | 'light'>(() => {
    if (theme.value && theme.value !== 'auto') {
      return theme.value
    }

    return preferred.value
  })

  const palette = computed<ThemePalette>(() => {
    const fallback = resolvedTheme.value === 'dark' ? DARK_PALETTE : LIGHT_PALETTE
    const element = root.value

    if (!element || typeof window === 'undefined') {
      return fallback
    }

    const styles = window.getComputedStyle(element)

    return {
      tooltipBg: styles.getPropertyValue('--vdc-tooltip-bg').trim() || fallback.tooltipBg,
      tooltipText: styles.getPropertyValue('--vdc-tooltip-text').trim() || fallback.tooltipText,
      tooltipMuted: styles.getPropertyValue('--vdc-tooltip-muted').trim() || fallback.tooltipMuted,
      tooltipBorder:
        styles.getPropertyValue('--vdc-tooltip-border').trim() || fallback.tooltipBorder,
      grid: styles.getPropertyValue('--vdc-grid').trim() || fallback.grid,
      zeroLine: styles.getPropertyValue('--vdc-zero-line').trim() || fallback.zeroLine,
      axisText: styles.getPropertyValue('--vdc-axis-text').trim() || fallback.axisText,
      track: styles.getPropertyValue('--vdc-track').trim() || fallback.track,
      surface: styles.getPropertyValue('--vdc-surface').trim() || fallback.surface,
      surfaceText: styles.getPropertyValue('--vdc-surface-text').trim() || fallback.surfaceText,
      positive: styles.getPropertyValue('--vdc-positive').trim() || fallback.positive,
      negative: styles.getPropertyValue('--vdc-negative').trim() || fallback.negative,
      emptyText: styles.getPropertyValue('--vdc-empty-text').trim() || fallback.emptyText,
    }
  })

  onMounted(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    query = window.matchMedia('(prefers-color-scheme: dark)')
    preferred.value = query.matches ? 'dark' : 'light'
    listener = (event) => {
      preferred.value = event.matches ? 'dark' : 'light'
    }

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', listener)
    } else {
      query.addListener(listener)
    }
  })

  onUnmounted(() => {
    if (!query || !listener) {
      return
    }

    if (typeof query.removeEventListener === 'function') {
      query.removeEventListener('change', listener)
    } else {
      query.removeListener(listener)
    }
  })

  watchEffect(() => {
    if (root.value) {
      root.value.dataset.vdcTheme = resolvedTheme.value
    }
  })

  return {
    resolvedTheme,
    palette,
  }
}
