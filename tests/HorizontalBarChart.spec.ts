import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import HorizontalBarChart from '../src/components/HorizontalBarChart.vue'

describe('HorizontalBarChart', () => {
  it('renders labels for each row', async () => {
    const wrapper = mount(HorizontalBarChart, {
      props: {
        bars: [
          { label: 'AAPL', value: 18 },
          { label: 'MSFT', value: -6 },
          { label: 'NVDA', value: 24 },
        ],
      },
    })

    await nextTick()

    expect(wrapper.text()).toContain('AAPL')
    expect(wrapper.text()).toContain('MSFT')
    expect(wrapper.text()).toContain('NVDA')
  })
})
