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
    expect(wrapper.find('path').attributes('d')).toContain('C')
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

  it('can render a straight dotted line and hide the zero line', async () => {
    const wrapper = mount(LineChart, {
      props: {
        points: [
          { x: '2026-03-01', y: 10 },
          { x: '2026-03-02', y: 20 },
          { x: '2026-03-03', y: 15 },
        ],
        color: '#123456',
        dotted: true,
        smooth: false,
        showZeroLine: false,
      },
    })

    await nextTick()

    const path = wrapper.find('path')
    expect(path.attributes('stroke')).toBe('#123456')
    expect(path.attributes('stroke-dasharray')).toBe('6 6')
    expect(path.attributes('d')).toContain('L')
    expect(path.attributes('d')).not.toContain('C')
    expect(wrapper.find('line[stroke-dasharray=\"4 4\"]').exists()).toBe(false)
  })

  it('can render multiple series through the LineChart wrapper', async () => {
    const wrapper = mount(LineChart, {
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
      },
    })

    await nextTick()

    const paths = wrapper.findAll('path')
    expect(paths).toHaveLength(2)
    expect(paths[0].attributes('stroke')).toBe('#111111')
    expect(paths[1].attributes('stroke')).toBe('#222222')
  })

  it('supports mixing solid and dotted lines per series', async () => {
    const wrapper = mount(LineChart, {
      props: {
        series: [
          {
            name: 'Actual',
            color: '#22c55e',
            points: [
              { x: 'Mon', y: 4 },
              { x: 'Tue', y: 6 },
            ],
          },
          {
            name: 'Forecast',
            color: '#f97316',
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

  it('can disable the neon glow', async () => {
    const wrapper = mount(LineChart, {
      props: {
        points: [
          { x: '2026-03-01', y: 10 },
          { x: '2026-03-02', y: 20 },
        ],
        neon: false,
      },
    })

    await nextTick()

    expect(wrapper.find('path').attributes('filter')).toBeUndefined()
  })
})
