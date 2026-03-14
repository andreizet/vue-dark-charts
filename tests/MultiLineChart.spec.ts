import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MultiLineChart from '../src/components/MultiLineChart.vue'

describe('MultiLineChart', () => {
  it('renders one path per series', async () => {
    const wrapper = mount(MultiLineChart, {
      props: {
        series: [
          {
            name: 'Alpha',
            points: [
              { x: 'Mon', y: 4 },
              { x: 'Tue', y: 6 },
            ],
          },
          {
            name: 'Beta',
            points: [
              { x: 'Mon', y: 2 },
              { x: 'Tue', y: 3 },
            ],
          },
        ],
      },
    })

    await nextTick()

    expect(wrapper.findAll('path')).toHaveLength(2)
  })
})
