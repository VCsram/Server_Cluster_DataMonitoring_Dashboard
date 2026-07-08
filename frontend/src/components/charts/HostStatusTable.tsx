import type { HostInfo } from '../../api/types'
import { formatMem, statusLabel } from '../../utils/format'
import './HostStatusTable.scss'

interface Props {
  data: HostInfo[]
}

export default function HostStatusTable({ data }: Props) {
  return (
    <div className="host-table">
      <div className="host-table__header">
        <span>主机</span>
        <span>机房</span>
        <span>CPU</span>
        <span>内存</span>
        <span>状态</span>
      </div>
      <div className="host-table__body">
        {data.map((h) => (
          <div key={h.hostid} className="host-table__row">
            <span title={h.hostname}>{h.hostid}</span>
            <span>{h.location1}</span>
            <span>{h.cpu_usage?.toFixed(1) ?? '-'}%</span>
            <span>{h.mem_used != null ? formatMem(h.mem_used) : '-'}</span>
            <span>
              <i className={`status-dot status-dot--${h.status}`} />
              {statusLabel(h.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
