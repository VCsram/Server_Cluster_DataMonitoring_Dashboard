import { useEffect, useRef, useState } from 'react'
import './FlipNumber.scss'

interface Props {
  label: string
  value: number
  suffix?: string
  decimals?: number
  color?: string
}

function formatNumber(num: number, decimals: number) {
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export default function FlipNumber({ label, value, suffix = '', decimals = 0, color }: Props) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef<number>(0)
  const startRef = useRef(0)
  const startTimeRef = useRef(0)

  useEffect(() => {
    const from = display
    const to = value
    startRef.current = from
    startTimeRef.current = performance.now()

    const duration = 1500
    const tick = (now: number) => {
      const progress = Math.min((now - startTimeRef.current) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setDisplay(startRef.current + (to - startRef.current) * eased)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="flip-number" style={color ? ({ '--flip-color': color } as React.CSSProperties) : undefined}>
      <div className="flip-number__value">
        {formatNumber(display, decimals)}
        {suffix && <span className="flip-number__suffix">{suffix}</span>}
      </div>
      <div className="flip-number__label">{label}</div>
    </div>
  )
}
