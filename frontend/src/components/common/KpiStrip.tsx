import FlipNumber from './FlipNumber'
import './KpiStrip.scss'

interface Props {
  hostCount: number
  onlineRate: number
  alertCount: number
  avgCpu: number
}

export default function KpiStrip({ hostCount, onlineRate, alertCount, avgCpu }: Props) {
  return (
    <div className="kpi-strip">
      <div className="kpi-strip__glow" aria-hidden />
      <div className="kpi-strip__beam" aria-hidden />
      <div className="kpi-strip__inner">
        <FlipNumber compact label="主机总数" value={hostCount} suffix="台" />
        <span className="kpi-strip__divider" aria-hidden />
        <FlipNumber compact label="在线率" value={onlineRate} suffix="%" decimals={1} color="#00e676" />
        <span className="kpi-strip__divider" aria-hidden />
        <FlipNumber compact label="告警数量" value={alertCount} suffix="条" color="#ff6b35" />
        <span className="kpi-strip__divider" aria-hidden />
        <FlipNumber compact label="平均 CPU" value={avgCpu} suffix="%" decimals={1} />
      </div>
    </div>
  )
}
