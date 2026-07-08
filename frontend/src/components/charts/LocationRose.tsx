import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { DistributionItem } from '../../api/types'
import { overflowTooltip } from '../../utils/echarts'

interface Props {
  data: DistributionItem[]
  title?: string
}

export default function LocationRose({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || !data.length) return
    const chart = echarts.init(ref.current)

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: overflowTooltip({ trigger: 'item' }),
      series: [
        {
          type: 'pie',
          radius: ['20%', '70%'],
          center: ['50%', '55%'],
          roseType: 'area',
          itemStyle: { borderRadius: 4, borderColor: '#0a1628', borderWidth: 2 },
          label: { color: '#8eb4d9', fontSize: 11 },
          data: data.map((d) => ({ name: d.name, value: d.value })),
          color: ['#00d4ff', '#1a6dff', '#00e676', '#ff6b35', '#a855f7', '#f59e0b'],
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
