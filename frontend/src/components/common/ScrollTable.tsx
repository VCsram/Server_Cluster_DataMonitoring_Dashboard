import { useEffect, useRef } from 'react'
import { levelColor } from '../../utils/format'
import type { AlertItem } from '../../api/types'
import './ScrollTable.scss'

interface Props {
  data: AlertItem[]
}

export default function ScrollTable({ data }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const doubled = [...data, ...data]

  useEffect(() => {
    const el = bodyRef.current
    if (!el || data.length < 4) return
    let offset = 0
    let animId = 0
    const rowH = 32

    const tick = () => {
      offset += 0.4
      if (offset >= data.length * rowH) offset = 0
      el.style.transform = `translateY(-${offset}px)`
      animId = requestAnimationFrame(tick)
    }
    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [data])

  if (!data.length) {
    return <div className="scroll-table scroll-table--empty">暂无告警</div>
  }

  return (
    <div className="scroll-table">
      <div className="scroll-table__header">
        <span>时间</span>
        <span>主机</span>
        <span>指标</span>
        <span>数值</span>
        <span>级别</span>
      </div>
      <div className="scroll-table__viewport">
        <div ref={bodyRef} className="scroll-table__body">
          {doubled.map((row, i) => (
            <div key={`${row.time}-${row.hostid}-${i}`} className="scroll-table__row">
              <span>{row.time.slice(5)}</span>
              <span>{row.hostid}</span>
              <span title={row.desc}>{row.desc}</span>
              <span style={{ color: levelColor(row.level) }}>
                {row.value}
                {row.unit}
              </span>
              <span>
                <i className={`level-dot level-dot--${row.level}`} />
                {row.level === 'critical' ? '严重' : '警告'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
