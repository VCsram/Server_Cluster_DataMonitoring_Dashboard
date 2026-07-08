import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { TrendPoint } from '../../api/types'
import { formatHour } from '../../utils/format'
import { overflowTooltip } from '../../utils/echarts'

interface Props {
  data: TrendPoint[]
}

export default function TrendChart({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || !data.length) return
    const chart = echarts.init(ref.current)
    const hours = data.map((d) => formatHour(d.hour))

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: overflowTooltip({ trigger: 'axis' }),
      legend: {
        data: ['CPU均值', '内存均值'],
        textStyle: { color: '#8eb4d9' },
        top: 0,
      },
      grid: { left: 50, right: 50, top: 40, bottom: 50 },
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 16, bottom: 8 }],
      xAxis: {
        type: 'category',
        data: hours,
        axisLabel: { color: '#8eb4d9', rotate: 30, fontSize: 10 },
        axisLine: { lineStyle: { color: 'rgba(0,212,255,0.3)' } },
      },
      yAxis: [
        {
          type: 'value',
          name: 'CPU %',
          axisLabel: { color: '#8eb4d9' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
        },
        {
          type: 'value',
          name: '内存 MB',
          axisLabel: { color: '#8eb4d9' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'CPU均值',
          type: 'line',
          smooth: true,
          data: data.map((d) => d.cpu_avg),
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0,212,255,0.4)' },
              { offset: 1, color: 'rgba(0,212,255,0.02)' },
            ]),
          },
          lineStyle: { color: '#00d4ff', width: 2 },
          itemStyle: { color: '#00d4ff' },
        },
        {
          name: '内存均值',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          data: data.map((d) => d.mem_avg),
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(26,109,255,0.35)' },
              { offset: 1, color: 'rgba(26,109,255,0.02)' },
            ]),
          },
          lineStyle: { color: '#1a6dff', width: 2 },
          itemStyle: { color: '#1a6dff' },
        },
      ],
      animationDurationUpdate: 800,
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
