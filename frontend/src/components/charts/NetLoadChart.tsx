import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { NetLoadPoint } from '../../api/types'
import { formatHour } from '../../utils/format'
import { overflowTooltip } from '../../utils/echarts'

interface Props {
  data: NetLoadPoint[]
}

export default function NetLoadChart({ data }: Props) {
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

      const points = data.slice(-24)
      const hours = points.map((d) => formatHour(d.hour))
      const labelInterval = Math.max(0, Math.floor(hours.length / 5) - 1)

      chartRef.current.setOption(
        {
          backgroundColor: 'transparent',
          animation: false,
          tooltip: overflowTooltip({ trigger: 'axis' }),
          legend: {
            data: ['入网', '出网', '负载'],
            textStyle: { color: '#8eb4d9', fontSize: 9 },
            top: 0,
            itemWidth: 10,
            itemHeight: 6,
          },
          grid: { left: 36, right: 36, top: 26, bottom: 20 },
          xAxis: {
            type: 'category',
            data: hours,
            boundaryGap: false,
            axisLabel: { color: '#8eb4d9', fontSize: 8, rotate: 25, interval: labelInterval },
            axisLine: { lineStyle: { color: 'rgba(0,212,255,0.2)' } },
          },
          yAxis: [
            {
              type: 'value',
              name: 'MB/s',
              nameTextStyle: { color: '#8eb4d9', fontSize: 9 },
              axisLabel: { color: '#8eb4d9', fontSize: 9 },
              splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
            },
            {
              type: 'value',
              name: '负载',
              nameTextStyle: { color: '#8eb4d9', fontSize: 9 },
              axisLabel: { color: '#8eb4d9', fontSize: 9 },
              splitLine: { show: false },
            },
          ],
          series: [
            {
              name: '入网',
              type: 'line',
              smooth: true,
              data: points.map((d) => d.net_in),
              lineStyle: { color: '#00d4ff', width: 1.5 },
              showSymbol: false,
            },
            {
              name: '出网',
              type: 'line',
              smooth: true,
              data: points.map((d) => d.net_out),
              lineStyle: { color: '#00e676', width: 1.5 },
              showSymbol: false,
            },
            {
              name: '负载',
              type: 'line',
              smooth: true,
              yAxisIndex: 1,
              data: points.map((d) => d.load_avg),
              lineStyle: { color: '#ff6b35', width: 1.5 },
              showSymbol: false,
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

  return <div ref={ref} className="chart-canvas chart-canvas--wide" />
}
