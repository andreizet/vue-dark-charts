import { mount } from '@vue/test-utils'
import RadialChart from '../src/components/RadialChart.vue'

describe('RadialChart', () => {
  it('renders one arc per ring', () => {
    const wrapper = mount(RadialChart, {
      props: {
        rings: [
          { label: 'Tech', value: 88 },
          { label: 'Healthcare', value: 76 },
          { label: 'Energy', value: 63 },
        ],
      },
    })

    expect(wrapper.findAll('.vdc-radial-arc')).toHaveLength(3)
  })

  it('emits the clicked ring', async () => {
    const wrapper = mount(RadialChart, {
      props: {
        rings: [
          { label: 'Tech', value: 88 },
          { label: 'Healthcare', value: 76 },
        ],
      },
    })

    await wrapper.find('.vdc-radial-arc').trigger('click')

    expect(wrapper.emitted('ring-click')).toBeTruthy()
    expect(wrapper.emitted('ring-click')?.[0]?.[0]).toMatchObject({
      label: 'Tech',
      value: 88,
    })
  })
})
