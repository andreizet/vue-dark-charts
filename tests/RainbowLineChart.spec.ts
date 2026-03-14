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
})
