import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchAlerts,
  fetchDbHealth,
  fetchDiskGauges,
  fetchDiskTop,
  fetchDistribution,
  fetchHeatmap,
  fetchHosts,
  fetchNetLoad,
  fetchOverview,
  fetchPrefTrend,
  fetchSparklines,
} from '../api'
import { useIsMobile } from '../hooks/useIsMobile'
import ParticleBg from '../components/effects/ParticleBg'
import ScanLine from '../components/effects/ScanLine'
import BorderBox from '../components/common/BorderBox'
import FlipNumber from '../components/common/FlipNumber'
import PanelTitle from '../components/common/PanelTitle'
import ScrollTable from '../components/common/ScrollTable'
import TrendChart from '../components/charts/TrendChart'
import HeatmapChart from '../components/charts/HeatmapChart'
import LocationRose from '../components/charts/LocationRose'
import OwnerBar from '../components/charts/OwnerBar'
import DiskGaugeChart from '../components/charts/DiskGauge'
import DiskScatter from '../components/charts/DiskScatter'
import DiskTopBar from '../components/charts/DiskTopBar'
import NetLoadChart from '../components/charts/NetLoadChart'
import SparklineMatrix from '../components/charts/SparklineMatrix'
import HostStatusTable from '../components/charts/HostStatusTable'
import Toast from '../components/common/Toast'
import LoadingProgress from '../components/common/LoadingProgress'
import '../styles/dashboard.scss'
import '../styles/responsive.scss'

const POLL_MS = 30000
const POLL_MS_SLOW = 60000
const POLL_MS_MOBILE = 90000

export default function MonitorScreen() {
  const isMobile = useIsMobile()

  const poll = isMobile ? POLL_MS_MOBILE : POLL_MS
  const pollSlow = isMobile ? POLL_MS_MOBILE : POLL_MS_SLOW
  const qOpts = { refetchInterval: poll, staleTime: poll - 2000 }
  const qSlow = { refetchInterval: pollSlow, staleTime: pollSlow - 2000 }

  const { data: dbHealth, isFetched: dbHealthReady } = useQuery({
    queryKey: ['dbHealth'],
    queryFn: fetchDbHealth,
    refetchInterval: 30000,
    staleTime: 0,
  })

  const dataEnabled = dbHealthReady
  const { data: overview, isFetched: overviewReady } = useQuery({
    queryKey: ['overview'],
    queryFn: fetchOverview,
    enabled: dataEnabled,
    ...qOpts,
  })
  const { data: hosts = [], isFetched: hostsReady } = useQuery({
    queryKey: ['hosts'],
    queryFn: fetchHosts,
    enabled: dataEnabled,
    ...qOpts,
  })
  const { data: distribution, isFetched: distributionReady } = useQuery({
    queryKey: ['distribution'],
    queryFn: fetchDistribution,
    enabled: dataEnabled,
    ...qOpts,
  })
  const { data: trend, isFetched: trendReady } = useQuery({
    queryKey: ['trend'],
    queryFn: () => fetchPrefTrend(),
    enabled: dataEnabled,
    ...qOpts,
  })
  const { data: heatmap, isFetched: heatmapReady } = useQuery({
    queryKey: ['heatmap'],
    queryFn: fetchHeatmap,
    enabled: dataEnabled,
    ...qOpts,
  })
  const { data: diskTop, isFetched: diskTopReady } = useQuery({
    queryKey: ['diskTop'],
    queryFn: fetchDiskTop,
    enabled: dataEnabled,
    ...qSlow,
  })
  const { data: diskGauges = [], isFetched: diskGaugesReady } = useQuery({
    queryKey: ['diskGauges'],
    queryFn: fetchDiskGauges,
    enabled: dataEnabled,
    ...qSlow,
  })
  const { data: alerts, isFetched: alertsReady } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    enabled: dataEnabled,
    ...qOpts,
  })
  const { data: sparklines, isFetched: sparklinesReady } = useQuery({
    queryKey: ['sparklines'],
    queryFn: fetchSparklines,
    enabled: dataEnabled,
    ...qOpts,
  })
  const { data: netLoad, isFetched: netLoadReady } = useQuery({
    queryKey: ['netLoad'],
    queryFn: fetchNetLoad,
    enabled: dataEnabled,
    ...qOpts,
  })

  const loadStatus = useMemo(() => {
    const tasks = [
      { label: '数据源探测', done: dbHealthReady },
      { label: '总览 KPI', done: overviewReady },
      { label: '主机列表', done: hostsReady },
      { label: '分布统计', done: distributionReady },
      { label: 'CPU/内存趋势', done: trendReady },
      { label: 'CPU 热力图', done: heatmapReady },
      { label: '磁盘 Top', done: diskTopReady },
      { label: '磁盘仪表', done: diskGaugesReady },
      { label: '告警数据', done: alertsReady },
      { label: 'Sparkline', done: sparklinesReady },
      { label: '网络负载', done: netLoadReady },
    ]

    const activeTasks = dataEnabled ? tasks : tasks.slice(0, 1)
    const done = activeTasks.filter((t) => t.done).length
    const total = activeTasks.length
    const currentTask = activeTasks.find((t) => !t.done)?.label

    return {
      visible: done < total,
      progress: total ? Math.round((done / total) * 100) : 0,
      done,
      total,
      currentTask,
    }
  }, [
    dataEnabled,
    dbHealthReady,
    overviewReady,
    hostsReady,
    distributionReady,
    trendReady,
    heatmapReady,
    diskTopReady,
    diskGaugesReady,
    alertsReady,
    sparklinesReady,
    netLoadReady,
  ])

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastShownRef = useRef(false)

  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // 仅以 dbHealth 为准弹出提示（探测完成后再判断，避免竞态）
  useEffect(() => {
    if (toastShownRef.current || !dbHealthReady || !dbHealth) return

    toastShownRef.current = true
    const isLocalMock = dbHealth.data_source === 'local'
    const fromDb =
      !isLocalMock && dbHealth.data_source === 'mysql' && dbHealth.mysql_connected
    setToastMessage(fromDb ? '已连接数据库' : '正在使用预存数据')
  }, [dbHealth, dbHealthReady])

  // 布局完成后通知 ECharts 重新计算尺寸
  useEffect(() => {
    const fire = () => window.dispatchEvent(new Event('resize'))
    const t1 = setTimeout(fire, 100)
    const t2 = setTimeout(fire, 500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const timeStr = now.toLocaleString('zh-CN', { hour12: false })

  const statusMessage = dbHealth?.message ?? (dbHealthReady ? '加载中...' : '正在探测数据源...')
  const statusOk =
    dbHealth?.data_source === 'mysql'
      ? dbHealth.mysql_connected
      : dbHealth?.data_source !== 'local' && dbHealth?.status === 'ok'

  return (
    <div className={`screen-wrapper ${isMobile ? 'mobile-mode' : ''}`}>
      <LoadingProgress
        visible={loadStatus.visible}
        progress={loadStatus.progress}
        done={loadStatus.done}
        total={loadStatus.total}
        currentTask={loadStatus.currentTask}
      />
      {toastMessage && (
        <Toast message={toastMessage} duration={6000} onClose={() => setToastMessage(null)} />
      )}
      <ParticleBg disabled={isMobile} />
      <div id="dashboard-root">
        <header className="dashboard-header">
          <div className="dashboard-header__top">
            <div className="db-status">
              <span className={`db-status__dot ${statusOk ? '' : 'db-status__dot--warn'}`} />
              {statusMessage}
              {overview?.data_source && (
                <span style={{ marginLeft: 8, opacity: 0.75 }}>
                  [{overview.data_source === 'local' ? '本地快照' : overview.data_source}]
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <h1 className="screen-title">服务器集群数据监控大屏</h1>
              <ScanLine />
            </div>
            <div className="clock-block">
              <div>{timeStr}</div>
              {overview && (
                <div style={{ fontSize: 11 }}>
                  数据范围: {overview.time_range_start.slice(0, 10)} ~ {overview.time_range_end.slice(0, 10)}
                </div>
              )}
            </div>
          </div>
          <div className="kpi-row">
            <FlipNumber label="主机总数" value={overview?.host_count ?? 0} suffix="台" />
            <FlipNumber label="在线率" value={overview?.online_rate ?? 0} suffix="%" decimals={1} color="#00e676" />
            <FlipNumber label="告警数量" value={overview?.alert_count ?? 0} suffix="条" color="#ff6b35" />
            <FlipNumber label="平均 CPU" value={overview?.avg_cpu ?? 0} suffix="%" decimals={1} />
          </div>
        </header>

        <main className="dashboard-main">
          <div className="dashboard-col dashboard-col--left">
            <BorderBox>
              <div className="panel panel--delay-1">
                <PanelTitle title="主机状态" subtitle={`${hosts.length} 台`} />
                <div className="panel__body">
                  <HostStatusTable data={hosts} />
                </div>
              </div>
            </BorderBox>
            <BorderBox>
              <div className="panel panel--delay-2">
                <PanelTitle title="机房分布" />
                <div className="panel__body">
                  <LocationRose data={distribution?.by_location ?? []} />
                </div>
              </div>
            </BorderBox>
            <BorderBox>
              <div className="panel panel--delay-3">
                <PanelTitle title="负责人分布" />
                <div className="panel__body">
                  <OwnerBar data={distribution?.by_owner ?? []} />
                </div>
              </div>
            </BorderBox>
          </div>

          <div className="dashboard-col dashboard-col--center">
            <BorderBox>
              <div className="panel panel--main panel--delay-1">
                <PanelTitle title="7天 CPU / 内存趋势" subtitle="核心指标" />
                <div className="panel__body">
                  <TrendChart data={trend?.points ?? []} />
                </div>
              </div>
            </BorderBox>
            <BorderBox>
              <div className="panel panel--heatmap panel--delay-2">
                <PanelTitle title="CPU 热力图" subtitle="20主机 × 近12小时" />
                <div className="panel__body">
                  <HeatmapChart data={heatmap ?? null} />
                </div>
              </div>
            </BorderBox>
          </div>

          <div className="dashboard-col dashboard-col--right">
            <BorderBox>
              <div className="panel panel--delay-1">
                <PanelTitle title="磁盘利用率" />
                <div className="panel__body">
                  <DiskGaugeChart data={diskGauges} />
                </div>
              </div>
            </BorderBox>
            <BorderBox>
              <div className="panel panel--delay-2">
                <PanelTitle title="磁盘延迟散点" />
                <div className="panel__body">
                  <DiskScatter data={diskTop?.scatter ?? []} />
                </div>
              </div>
            </BorderBox>
            <BorderBox>
              <div className="panel panel--delay-3">
                <PanelTitle title="磁盘 Top5" />
                <div className="panel__body">
                  <DiskTopBar data={diskTop?.top_util.slice(0, 5) ?? []} />
                </div>
              </div>
            </BorderBox>
          </div>
        </main>

        <footer className="dashboard-footer">
          <BorderBox>
            <div className="panel panel--delay-1">
              <PanelTitle title="实时告警" subtitle={`共 ${alerts?.total ?? 0} 条`} />
              <div className="panel__body">
                <ScrollTable data={alerts?.alerts ?? []} />
              </div>
            </div>
          </BorderBox>
          <BorderBox>
            <div className="panel panel--chart-wide panel--delay-2">
              <PanelTitle title="网络 / 负载" subtitle="近24小时" />
              <div className="panel__body">
                <NetLoadChart data={netLoad?.points ?? []} />
              </div>
            </div>
          </BorderBox>
          <BorderBox>
            <div className="panel panel--chart-wide panel--sparkline panel--delay-3">
              <PanelTitle title="CPU Sparkline" subtitle="12主机 24h" />
              <div className="panel__body">
                <SparklineMatrix data={sparklines?.series ?? []} />
              </div>
            </div>
          </BorderBox>
        </footer>
      </div>
    </div>
  )
}
