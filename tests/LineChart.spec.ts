import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import LineChart from '../src/components/LineChart.vue'

describe('LineChart', () => {
  it('renders a smooth line path for multiple points', async () => {
    const wrapper = mount(LineChart, {
      props: {
        points: [
          { x: '2026-03-01', y: 10 },
          { x: '2026-03-02', y: 20 },
          { x: '2026-03-03', y: 15 },
        ],
      },
    })

    await nextTick()

    expect(wrapper.find('path').exists()).toBe(true)
  })

  it('renders a single point without crashing', async () => {
    const wrapper = mount(LineChart, {
      props: {
        points: [{ x: 'Only', y: 42 }],
      },
    })

    await nextTick()

    expect(wrapper.find('circle').exists()).toBe(true)
  })
})
