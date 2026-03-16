import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import PieChart from '../src/components/PieChart.vue'

describe('PieChart', () => {
  it('toggles a legend item and updates the visible slices', async () => {
    const wrapper = mount(PieChart, {
      props: {
        segments: [
          { label: 'Tech', value: 10 },
          { label: 'Energy', value: 3 },
          { label: 'Health', value: 2 },
        ],
      },
    })

    await nextTick()
    expect(wrapper.findAll('path')).toHaveLength(3)
    expect(wrapper.text()).not.toContain('total')

    await wrapper.findAll('.vdc-donut-item')[0].trigger('click')
    await nextTick()

    expect(wrapper.findAll('path')).toHaveLength(2)
  })

  it('emits the clicked segment', async () => {
    const wrapper = mount(PieChart, {
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

  it('renders rounded slice corners', async () => {
    const wrapper = mount(PieChart, {
      props: {
        segments: [
          { label: 'Tech', value: 10 },
          { label: 'Energy', value: 3 },
        ],
      },
    })

    await nextTick()

    expect(wrapper.find('path').attributes('d')).toContain('Q')
  })

  it('can disable the neon glow', async () => {
    const wrapper = mount(PieChart, {
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
