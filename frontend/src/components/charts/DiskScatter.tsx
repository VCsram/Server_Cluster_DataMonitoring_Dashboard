import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { DiskScatterPoint } from '../../api/types'
import { overflowTooltip } from '../../utils/echarts'

interface Props {
  data: DiskScatterPoint[]
}

export default function DiskScatter({ data }: Props) {
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

      // 去重并限制点数，避免重叠混乱
      const map = new Map<string, DiskScatterPoint>()
      for (const p of data) {
        const key = `${p.hostid}-${p.mod}`
        const prev = map.get(key)
        if (!prev || p.util > prev.util) map.set(key, p)
      }
      const points = [...map.values()]
        .sort((a, b) => b.util - a.util)
        .slice(0, 18)

      chartRef.current.setOption(
        {
          backgroundColor: 'transparent',
          animation: false,
          grid: { left: 44, right: 12, top: 16, bottom: 28 },
          tooltip: overflowTooltip({
            trigger: 'item',
            formatter: (p) => {
              const [util, awaitMs, hostid, mod] = (p as unknown as { data: [number, number, string, string] }).data
              return `${hostid} ${mod}<br/>利用率: ${util}%<br/>等待: ${awaitMs}ms`
            },
          }),
          xAxis: {
            name: '利用率%',
            nameTextStyle: { color: '#8eb4d9', fontSize: 9 },
            type: 'value',
            min: 0,
            max: 100,
            axisLabel: { color: '#8eb4d9', fontSize: 9 },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
          },
          yAxis: {
            name: '等待ms',
            nameTextStyle: { color: '#8eb4d9', fontSize: 9 },
            type: 'value',
            axisLabel: { color: '#8eb4d9', fontSize: 9 },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
          },
          series: [
            {
              type: 'scatter',
              symbolSize: (val: number[]) => Math.max(6, Math.min(16, val[0] / 8)),
              data: points.map((p) => [p.util, p.await_ms, p.hostid, p.mod]),
              itemStyle: {
                color: (params: { data: [number, number] }) =>
                  params.data[0] > 90 ? '#ff4757' : params.data[0] > 70 ? '#ff6b35' : '#00d4ff',
                opacity: 0.85,
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
