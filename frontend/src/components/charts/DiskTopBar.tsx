import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { DiskTopItem } from '../../api/types'
import { overflowTooltip } from '../../utils/echarts'

interface Props {
  data: DiskTopItem[]
}

export default function DiskTopBar({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!ref.current || !data.length) return

    const render = () => {
      const el = ref.current!
      if (!el.clientWidth || !el.clientHeight) {
        requestAnimationFrame(render)
        return
      }
      if (!chartRef.current) {
        chartRef.current = echarts.init(el)
      }

      const items = data.slice(0, 5)
      const labels = items.map((d) => `${d.hostid} · ${d.mod.replace('_util', '').toUpperCase()}`)
      const values = items.map((d) => d.value)

      chartRef.current.setOption(
        {
          backgroundColor: 'transparent',
          animation: false,
          tooltip: overflowTooltip({ trigger: 'axis' }),
          grid: { left: 8, right: 40, top: 8, bottom: 8, containLabel: true },
          xAxis: {
            type: 'value',
            max: 100,
            axisLabel: { color: '#8eb4d9', fontSize: 9, formatter: '{value}%' },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
          },
          yAxis: {
            type: 'category',
            data: labels,
            axisLabel: { color: '#8eb4d9', fontSize: 10, width: 90, overflow: 'truncate' },
            axisTick: { show: false },
            axisLine: { show: false },
          },
          series: [
            {
              type: 'bar',
              data: values.map((v) => ({
                value: v,
                itemStyle: {
                  color: v > 90 ? '#ff4757' : v > 70 ? '#ff6b35' : '#00d4ff',
                  borderRadius: [0, 4, 4, 0],
                },
              })),
              barWidth: 10,
              barCategoryGap: '55%',
              label: {
                show: true,
                position: 'right',
                color: '#e0f0ff',
                fontSize: 10,
                formatter: '{c}%',
              },
            },
          ],
        },
        { notMerge: true },
      )
      chartRef.current.resize()
    }

    render()
    const ro = new ResizeObserver(() => chartRef.current?.resize())
    ro.observe(ref.current)
    return () => {
      ro.disconnect()
      chartRef.current?.dispose()
      chartRef.current = null
    }
  }, [data])

  return <div ref={ref} className="chart-canvas" />
}
