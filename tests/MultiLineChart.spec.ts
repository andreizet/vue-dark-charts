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

  it('supports top-level colors plus dotted, straight lines, and zero-line hiding', async () => {
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
        colors: ['#111111', '#222222'],
        dotted: true,
        smooth: false,
        showZeroLine: false,
      },
    })

    await nextTick()

    const paths = wrapper.findAll('path')
    expect(paths).toHaveLength(2)
    expect(paths[0].attributes('stroke')).toBe('#111111')
    expect(paths[1].attributes('stroke')).toBe('#222222')
    expect(paths[0].attributes('stroke-dasharray')).toBe('6 6')
    expect(paths[1].attributes('stroke-dasharray')).toBe('6 6')
    expect(paths[0].attributes('d')).toContain('L')
    expect(paths[0].attributes('d')).not.toContain('C')
    expect(wrapper.find('line[stroke-dasharray=\"4 4\"]').exists()).toBe(false)
  })

  it('lets a series override the chart-wide dotted setting', async () => {
    const wrapper = mount(MultiLineChart, {
      props: {
        series: [
          {
            name: 'Actual',
            dotted: false,
            points: [
              { x: 'Mon', y: 4 },
              { x: 'Tue', y: 6 },
            ],
          },
          {
            name: 'Forecast',
            dotted: true,
            points: [
              { x: 'Mon', y: 5 },
              { x: 'Tue', y: 7 },
            ],
          },
        ],
      },
    })

    await nextTick()

    const paths = wrapper.findAll('path')
    expect(paths).toHaveLength(2)
    expect(paths[0].attributes('stroke-dasharray')).toBeUndefined()
    expect(paths[1].attributes('stroke-dasharray')).toBe('6 6')
  })
})
