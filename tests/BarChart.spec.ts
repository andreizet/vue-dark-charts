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

  it('can render multiple grouped series through the BarChart wrapper', async () => {
    const wrapper = mount(BarChart, {
      props: {
        series: [
          {
            name: 'Revenue',
            bars: [
              { label: 'Jan', value: 12 },
              { label: 'Feb', value: 18 },
            ],
          },
          {
            name: 'Costs',
            color: '#315efb',
            bars: [
              { label: 'Jan', value: 9 },
              { label: 'Feb', value: 14 },
            ],
          },
        ],
        valueMode: 'number',
      },
    })

    await nextTick()

    expect(wrapper.text()).toContain('Jan')
    expect(wrapper.text()).toContain('Feb')
    expect(wrapper.findAll('rect').length).toBeGreaterThanOrEqual(4)
  })

  it('supports stacked charts with gradient fills', async () => {
    const wrapper = mount(BarChart, {
      props: {
        stacked: true,
        series: [
          {
            name: 'North',
            gradient: {
              from: '#34d399',
              to: '#14b8a6',
            },
            bars: [
              { label: 'Q1', value: 16 },
              { label: 'Q2', value: 12 },
            ],
          },
          {
            name: 'South',
            color: '#315efb',
            bars: [
              { label: 'Q1', value: 10 },
              { label: 'Q2', value: 8 },
            ],
          },
        ],
        valueMode: 'number',
      },
    })

    await nextTick()

    expect(wrapper.findAll('linearGradient').length).toBeGreaterThan(0)
    expect(wrapper.findAll('rect').some((rect) => rect.attributes('fill')?.startsWith('url(#'))).toBe(true)
  })

  it('renders horizontal stacked series through the main BarChart component', async () => {
    const wrapper = mount(BarChart, {
      props: {
        orientation: 'horizontal',
        stacked: true,
        series: [
          {
            name: 'Desktop',
            color: '#14b8a6',
            bars: [
              { label: 'Jan', value: 18 },
              { label: 'Feb', value: 24 },
            ],
          },
          {
            name: 'Mobile',
            color: '#f59e0b',
            bars: [
              { label: 'Jan', value: 8 },
              { label: 'Feb', value: 10 },
            ],
          },
          {
            name: 'Tablet',
            color: '#315efb',
            bars: [
              { label: 'Jan', value: 12 },
              { label: 'Feb', value: 20 },
            ],
          },
        ],
        valueMode: 'number',
      },
    })

    await nextTick()

    expect(wrapper.text()).toContain('Jan')
    expect(wrapper.text()).toContain('Feb')
    expect(wrapper.findAll('rect').length).toBeGreaterThanOrEqual(8)
  })
})
