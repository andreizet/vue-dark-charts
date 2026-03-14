import { onMounted, onUnmounted, ref, type Ref } from 'vue'

export function useResize(target: Ref<HTMLElement | null>) {
  const width = ref(0)
  const height = ref(0)

  let observer: ResizeObserver | null = null

  function updateFromElement(element: HTMLElement) {
    width.value = element.clientWidth
    height.value = element.clientHeight
  }

  onMounted(() => {
    if (!target.value) {
      return
    }

    updateFromElement(target.value)

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    observer = new ResizeObserver(([entry]) => {
      if (!entry) {
        return
      }

      width.value = entry.contentRect.width
      height.value = entry.contentRect.height
    })

    observer.observe(target.value)
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  return {
    width,
    height,
  }
}
