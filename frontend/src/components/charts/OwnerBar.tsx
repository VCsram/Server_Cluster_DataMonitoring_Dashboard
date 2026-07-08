import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { DistributionItem } from '../../api/types'
import { overflowTooltip } from '../../utils/echarts'

interface Props {
  data: DistributionItem[]
}

export default function OwnerBar({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || !data.length) return
    const chart = echarts.init(ref.current)
    const names = data.map((d) => d.name)
    const values = data.map((d) => d.value)

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: overflowTooltip({ trigger: 'axis' }),
      grid: { left: 60, right: 20, top: 10, bottom: 20 },
      xAxis: {
        type: 'value',
        axisLabel: { color: '#8eb4d9' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLabel: { color: '#8eb4d9', fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: values,
          barWidth: 12,
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#1a6dff' },
              { offset: 1, color: '#00d4ff' },
            ]),
          },
        },
      ],
    })

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [data])

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />
}
