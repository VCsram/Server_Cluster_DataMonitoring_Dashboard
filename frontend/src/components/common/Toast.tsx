import { useEffect, useState } from 'react'
import './Toast.scss'

interface ToastProps {
  message: string
  duration?: number
  onClose?: () => void
}

export default function Toast({ message, duration = 6000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setLeaving(true), duration - 400)
    const closeTimer = setTimeout(() => {
      setVisible(false)
      onClose?.()
    }, duration)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(closeTimer)
    }
  }, [duration, onClose])

  if (!visible) return null

  const isDb = message.includes('数据库')

  return (
    <div className={`data-toast ${leaving ? 'data-toast--leave' : ''} ${isDb ? 'data-toast--db' : 'data-toast--local'}`}>
      <span className="data-toast__icon">{isDb ? '●' : '◆'}</span>
      <span className="data-toast__text">{message}</span>
    </div>
  )
}
