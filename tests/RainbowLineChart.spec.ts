import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import RainbowLineChart from '../src/components/RainbowLineChart.vue'

describe('RainbowLineChart', () => {
  it('keeps negative-only data on the negative gradient color', async () => {
    const wrapper = mount(RainbowLineChart, {
      props: {
        points: [
          { x: 'One', y: -12 },
          { x: 'Two', y: -20 },
          { x: 'Three', y: -6 },
        ],
      },
    })

    await nextTick()

    const stops = wrapper.findAll('stop')
    expect(stops.length).toBeGreaterThan(0)
    expect(stops.every((stop) => stop.attributes('stop-color') === '#ef4444')).toBe(true)
  })

  it('supports custom gradient colors, dotted lines, straight segments, and hiding the zero line', async () => {
    const wrapper = mount(RainbowLineChart, {
      props: {
        points: [
          { x: 'One', y: 8 },
          { x: 'Two', y: -10 },
          { x: 'Three', y: 6 },
        ],
        positiveColor: '#00aa88',
        negativeColor: '#bb3355',
        dotted: true,
        smooth: false,
        showZeroLine: false,
      },
    })

    await nextTick()

    const path = wrapper.find('path')
    const stopColors = wrapper.findAll('stop').map((stop) => stop.attributes('stop-color'))

    expect(path.attributes('stroke-dasharray')).toBe('6 6')
    expect(path.attributes('d')).toContain('L')
    expect(path.attributes('d')).not.toContain('C')
    expect(stopColors).toContain('#00aa88')
    expect(stopColors).toContain('#bb3355')
    expect(wrapper.find('line[stroke-dasharray=\"4 4\"]').exists()).toBe(false)
  })
})
