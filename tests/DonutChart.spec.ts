import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import DonutChart from '../src/components/DonutChart.vue'

describe('DonutChart', () => {
  it('toggles a legend item and updates the center total', async () => {
    const wrapper = mount(DonutChart, {
      props: {
        segments: [
          { label: 'Tech', value: 10 },
          { label: 'Energy', value: 3 },
          { label: 'Health', value: 2 },
        ],
      },
    })

    await nextTick()
    expect(wrapper.text()).toContain('15')

    await wrapper.findAll('.vdc-donut-item')[0].trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('5')
  })

  it('emits the clicked segment', async () => {
    const wrapper = mount(DonutChart, {
      props: {
        segments: [
          { label: 'Tech', value: 10 },
          { label: 'Energy', value: 3 },
        ],
      },
    })

    await nextTick()
    await wrapper.find('path').trigger('click')

    expect(wrapper.emitted('segment-click')).toBeTruthy()
  })

  it('can disable the neon glow', async () => {
    const wrapper = mount(DonutChart, {
      props: {
        segments: [
          { label: 'Tech', value: 10 },
          { label: 'Energy', value: 3 },
        ],
        neon: false,
      },
    })

    await nextTick()

    expect(wrapper.find('path').attributes('filter')).toBeUndefined()
  })
})
