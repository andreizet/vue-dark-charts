import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import BarChart from '../src/components/BarChart.vue'

describe('BarChart', () => {
  it('renders one rect per bar value', async () => {
    const wrapper = mount(BarChart, {
      props: {
        bars: [
          { label: 'Mon', value: 12 },
          { label: 'Tue', value: -4 },
          { label: 'Wed', value: 9 },
        ],
      },
    })

    await nextTick()

    const rects = wrapper.findAll('rect')
    expect(rects.length).toBeGreaterThanOrEqual(3)
  })
})
