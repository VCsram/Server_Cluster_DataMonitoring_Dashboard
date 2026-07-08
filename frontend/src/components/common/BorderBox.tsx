import type { ReactNode } from 'react'
import './BorderBox.scss'

interface Props {
  children: ReactNode
  className?: string
}

export default function BorderBox({ children, className = '' }: Props) {
  return (
    <div className={`border-box ${className}`}>
      <div className="border-box__glow" />
      <span className="border-box__corner border-box__corner--tl" />
      <span className="border-box__corner border-box__corner--tr" />
      <span className="border-box__corner border-box__corner--bl" />
      <span className="border-box__corner border-box__corner--br" />
      {children}
    </div>
  )
}
