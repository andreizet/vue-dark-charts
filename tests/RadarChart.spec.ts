import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import RadarChart from '../src/components/RadarChart.vue'

describe('RadarChart', () => {
  it('renders one polygon per radar series', async () => {
    const wrapper = mount(RadarChart, {
      props: {
        series: [
          {
            name: 'Desktop',
            points: [
              { x: 'Jan', y: 180 },
              { x: 'Feb', y: 320 },
              { x: 'Mar', y: 240 },
            ],
          },
          {
            name: 'Mobile',
            points: [
              { x: 'Jan', y: 110 },
              { x: 'Feb', y: 210 },
              { x: 'Mar', y: 170 },
            ],
          },
        ],
      },
    })

    await nextTick()

    expect(wrapper.findAll('.vdc-radar-area')).toHaveLength(2)
    expect(wrapper.findAll('.vdc-radar-line')).toHaveLength(2)
  })

  it('shows a shared tooltip for the hovered axis', async () => {
    const wrapper = mount(RadarChart, {
      attachTo: document.body,
      props: {
        series: [
          {
            name: 'Desktop',
            color: '#2458ff',
            points: [
              { x: 'March', y: 214 },
              { x: 'April', y: 273 },
              { x: 'May', y: 182 },
            ],
          },
          {
            name: 'Mobile',
            color: '#a855f7',
            points: [
              { x: 'March', y: 162 },
              { x: 'April', y: 203 },
              { x: 'May', y: 121 },
            ],
          },
        ],
      },
    })

    await nextTick()

    await wrapper.findAll('.vdc-radar-zone')[1].trigger('mouseenter')
    await nextTick()

    const tooltip = document.body.querySelector('.vdc-radar-tooltip')

    expect(tooltip).not.toBeNull()
    expect(document.body.textContent).toContain('April')
    expect(document.body.textContent).toContain('Desktop')
    expect(document.body.textContent).toContain('273')
    expect(document.body.textContent).toContain('Mobile')
    expect(document.body.textContent).toContain('203')

    wrapper.unmount()
  })
})
