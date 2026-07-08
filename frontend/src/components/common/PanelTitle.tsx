import './PanelTitle.scss'

interface Props {
  title: string
  subtitle?: string
}

export default function PanelTitle({ title, subtitle }: Props) {
  return (
    <div className="panel-title">
      <span className="panel-title__icon" />
      <span className="panel-title__text">{title}</span>
      {subtitle && <span className="panel-title__sub">{subtitle}</span>}
    </div>
  )
}
