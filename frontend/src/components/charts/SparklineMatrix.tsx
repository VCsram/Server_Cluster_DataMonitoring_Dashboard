import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { SparklineSeries } from '../../api/types'
import { formatHour } from '../../utils/format'
import { overflowTooltip } from '../../utils/echarts'

interface Props {
  data: SparklineSeries[]
}

const COLORS = ['#00d4ff', '#1a6dff', '#00e676', '#ff6b35', '#a855f7', '#f59e0b', '#ec4899', '#14b8a6']

export default function SparklineMatrix({ data }: Props) {
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

      const series = data.slice(0, 12)
      const hours = series[0]?.hours.map(formatHour) ?? []

      chartRef.current.setOption(
        {
          backgroundColor: 'transparent',
          animation: false,
          grid: { left: 44, right: 12, top: 14, bottom: 36 },
          legend: {
            type: 'scroll',
            orient: 'horizontal',
            bottom: 0,
            left: 'center',
            textStyle: { color: '#8eb4d9', fontSize: 9 },
            itemWidth: 10,
            itemHeight: 6,
            itemGap: 8,
            pageTextStyle: { color: '#8eb4d9' },
          },
          tooltip: overflowTooltip({ trigger: 'axis' }),
          xAxis: {
            type: 'category',
            data: hours,
            boundaryGap: false,
            axisLabel: { color: '#8eb4d9', fontSize: 8, interval: Math.floor(hours.length / 6) },
            axisLine: { lineStyle: { color: 'rgba(0,212,255,0.2)' } },
          },
          yAxis: {
            type: 'value',
            name: 'CPU%',
            nameLocation: 'end',
            nameGap: 6,
            nameTextStyle: { color: '#8eb4d9', fontSize: 9, align: 'right' },
            axisLabel: { color: '#8eb4d9', fontSize: 9 },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
          },
          series: series.map((s, i) => ({
            name: s.hostid,
            type: 'line',
            smooth: true,
            showSymbol: false,
            data: s.values,
            lineStyle: { width: 1.2, color: COLORS[i % COLORS.length] },
          })),
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
