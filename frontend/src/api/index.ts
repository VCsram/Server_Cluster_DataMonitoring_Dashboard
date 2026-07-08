import { requestWithFallback } from './client'
import type {
  AlertResponse,
  DbHealth,
  DiskGauge,
  DiskTopResponse,
  Distribution,
  HeatmapResponse,
  HostInfo,
  NetLoadPoint,
  Overview,
  SparklineSeries,
  TrendResponse,
} from './types'

export const fetchOverview = () => requestWithFallback<Overview>('/overview')
export const fetchHosts = () => requestWithFallback<HostInfo[]>('/hosts')
export const fetchDistribution = () => requestWithFallback<Distribution>('/hosts/distribution')
export const fetchPrefTrend = (hostid?: string) =>
  requestWithFallback<TrendResponse>('/metrics/pref/trend', { params: { hostid } })
export const fetchHeatmap = () => requestWithFallback<HeatmapResponse>('/metrics/pref/heatmap')
export const fetchDiskTop = () => requestWithFallback<DiskTopResponse>('/metrics/disk/top')
export const fetchDiskGauges = () => requestWithFallback<DiskGauge[]>('/metrics/disk/gauges')
export const fetchAlerts = () => requestWithFallback<AlertResponse>('/alerts')
export const fetchSparklines = () =>
  requestWithFallback<{ series: SparklineSeries[] }>('/metrics/sparklines')
export const fetchNetLoad = () =>
  requestWithFallback<{ points: NetLoadPoint[] }>('/metrics/net-load')
export const fetchDbHealth = () => requestWithFallback<DbHealth>('/health/db')
