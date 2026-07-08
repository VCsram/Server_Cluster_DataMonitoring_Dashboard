import type {
  AlertResponse,
  DbHealth,
  DiskGauge,
  DiskTopResponse,
  Distribution,
  HeatmapResponse,
  HostInfo,
  Overview,
  SparklineSeries,
  TrendResponse,
} from '../api/types'
import mockData from './data.json'

export type MockBundle = typeof mockData

let backendAvailable: boolean | null = null

/** @deprecated 请使用 api/client 的 isBackendReady */
export function isBackendAvailable(): boolean | null {
  return backendAvailable
}

/** @deprecated 由 probeBackend 统一管理 */
export function setBackendAvailable(value: boolean): void {
  backendAvailable = value
}

export function getLocalOverview(): Overview {
  return mockData.overview as Overview
}

export function getLocalHosts(): HostInfo[] {
  return mockData.hosts as HostInfo[]
}

export function getLocalDistribution(): Distribution {
  return mockData.distribution as Distribution
}

export function getLocalTrend(): TrendResponse {
  return mockData.trend as TrendResponse
}

export function getLocalHeatmap(): HeatmapResponse {
  return mockData.heatmap as HeatmapResponse
}

export function getLocalDiskTop(): DiskTopResponse {
  return mockData.diskTop as DiskTopResponse
}

export function getLocalDiskGauges(): DiskGauge[] {
  return mockData.diskGauges as DiskGauge[]
}

export function getLocalAlerts(): AlertResponse {
  return mockData.alerts as AlertResponse
}

export function getLocalSparklines(): { series: SparklineSeries[] } {
  return mockData.sparklines as { series: SparklineSeries[] }
}

export function getLocalNetLoad(): { points: import('../api/types').NetLoadPoint[] } {
  return mockData.netLoad as { points: import('../api/types').NetLoadPoint[] }
}

export function getLocalDbHealth(): DbHealth {
  return mockData.dbHealth as DbHealth
}

export const LOCAL_ENDPOINTS: Record<string, () => unknown> = {
  '/overview': getLocalOverview,
  '/hosts': getLocalHosts,
  '/hosts/distribution': getLocalDistribution,
  '/metrics/pref/trend': getLocalTrend,
  '/metrics/pref/heatmap': getLocalHeatmap,
  '/metrics/disk/top': getLocalDiskTop,
  '/metrics/disk/gauges': getLocalDiskGauges,
  '/alerts': getLocalAlerts,
  '/metrics/sparklines': getLocalSparklines,
  '/metrics/net-load': getLocalNetLoad,
  '/health/db': getLocalDbHealth,
}

export function getLocalData(path: string): unknown {
  const resolver = LOCAL_ENDPOINTS[path]
  if (!resolver) {
    throw new Error(`未找到本地 mock 数据: ${path}`)
  }
  return resolver()
}
