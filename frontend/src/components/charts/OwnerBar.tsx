import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { DistributionItem } from '../../api/types'
import { overflowTooltip } from '../../utils/echarts'

interface Props {
  data: DistributionItem[]
}

const COLORS = ['#00d4ff', '#1a6dff', '#00e676', '#ff6b35', '#a855f7', '#f59e0b', '#ec4899', '#14b8a6']

export default function OwnerBar({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || !data.length) return
    const chart = echarts.init(ref.current)

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: overflowTooltip({
        trigger: 'item',
        formatter: '{b}<br/>主机数：{c} 台 ({d}%)',
      }),
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: 4,
        top: 'middle',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 8,
        textStyle: { color: '#8eb4d9', fontSize: 10 },
        pageTextStyle: { color: '#8eb4d9' },
      },
      series: [
        {
          type: 'pie',
          radius: ['38%', '62%'],
          center: ['38%', '52%'],
          avoidLabelOverlap: true,
          minAngle: 8,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#0a1628',
            borderWidth: 2,
          },
          label: {
            show: true,
            position: 'outside',
            color: '#8eb4d9',
            fontSize: 10,
            formatter: '{b}\n{c}台',
            lineHeight: 14,
          },
          labelLine: {
            length: 10,
            length2: 8,
            smooth: true,
            lineStyle: { color: 'rgba(142,180,217,0.5)' },
          },
          emphasis: {
            scale: true,
            scaleSize: 6,
            label: { fontSize: 11, fontWeight: 'bold' },
          },
          data: data.map((d, i) => ({
            name: d.name,
            value: d.value,
            itemStyle: { color: COLORS[i % COLORS.length] },
          })),
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
