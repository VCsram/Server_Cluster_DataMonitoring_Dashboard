import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { HeatmapResponse } from '../../api/types'
import { formatHour } from '../../utils/format'
import { overflowTooltip } from '../../utils/echarts'

interface Props {
  data: HeatmapResponse | null
}

export default function HeatmapChart({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!ref.current || !data?.cells.length) return

    const render = () => {
      const el = ref.current!
      if (!el.clientWidth || !el.clientHeight) {
        requestAnimationFrame(render)
        return
      }
      if (!chartRef.current) {
        chartRef.current = echarts.init(el)
      }

      // 取最近 12 小时，减少横向拥挤
      const hours = data.hours.slice(-12)
      const hosts = data.hosts
      const hourIndex = new Map(hours.map((h, i) => [h, i]))

      const heatData = data.cells
        .filter((c) => hourIndex.has(c.hour))
        .map((c) => [hourIndex.get(c.hour)!, hosts.indexOf(c.hostid), c.value])
        .filter((d) => d[1] >= 0)

      chartRef.current.setOption(
        {
          backgroundColor: 'transparent',
          animation: false,
          tooltip: overflowTooltip({
            position: 'top',
            formatter: (p) => {
              const [xi, yi, val] = (p as { data: number[] }).data
              return `${hosts[yi]}<br/>${formatHour(hours[xi])}<br/>CPU: ${val}%`
            },
          }),
          grid: { left: 52, right: 48, top: 10, bottom: 36 },
          xAxis: {
            type: 'category',
            data: hours.map(formatHour),
            axisLabel: {
              color: '#8eb4d9',
              fontSize: 8,
              rotate: 28,
              interval: 0,
              margin: 10,
            },
            axisLine: { lineStyle: { color: 'rgba(0,212,255,0.2)' } },
            splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.02)', 'transparent'] } },
          },
          yAxis: {
            type: 'category',
            data: hosts,
            axisLabel: { color: '#8eb4d9', fontSize: 8, width: 42, overflow: 'truncate' },
            splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.02)', 'transparent'] } },
          },
          visualMap: {
            min: 0,
            max: 100,
            calculable: false,
            orient: 'vertical',
            right: 6,
            top: 'center',
            itemWidth: 8,
            itemHeight: 90,
            text: ['100', '0'],
            textGap: 6,
            textStyle: { color: '#8eb4d9', fontSize: 8 },
            inRange: { color: ['#0a2a4a', '#1a6dff', '#00d4ff', '#ff6b35'] },
          },
          series: [
            {
              type: 'heatmap',
              data: heatData,
              label: { show: false },
              emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,212,255,0.4)' } },
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
