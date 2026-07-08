export interface Overview {
  host_count: number
  online_rate: number
  alert_count: number
  avg_cpu: number
  avg_mem: number
  time_range_start: string
  time_range_end: string
  data_source: string
}

export interface HostInfo {
  hostid: string
  hostname: string
  owner: string
  model: string
  location1: string
  location2: string
  status: string
  cpu_usage: number | null
  mem_used: number | null
}

export interface DistributionItem {
  name: string
  value: number
}

export interface Distribution {
  by_location: DistributionItem[]
  by_model: DistributionItem[]
  by_owner: DistributionItem[]
}

export interface TrendPoint {
  hour: string
  cpu_avg: number
  mem_avg: number
}

export interface TrendResponse {
  points: TrendPoint[]
  hostid: string | null
}

export interface HeatmapCell {
  hostid: string
  hour: string
  value: number
}

export interface HeatmapResponse {
  hosts: string[]
  hours: string[]
  cells: HeatmapCell[]
}

export interface DiskTopItem {
  hostid: string
  mod: string
  value: number
  desc: string
  unit: string
}

export interface DiskScatterPoint {
  hostid: string
  mod: string
  util: number
  await_ms: number
}

export interface DiskTopResponse {
  top_util: DiskTopItem[]
  scatter: DiskScatterPoint[]
}

export interface DiskGauge {
  mod: string
  desc: string
  value: number
  unit: string
}

export interface AlertItem {
  time: string
  hostid: string
  hostname: string
  metric: string
  desc: string
  value: number
  unit: string
  level: string
}

export interface AlertResponse {
  alerts: AlertItem[]
  total: number
}

export interface SparklineSeries {
  hostid: string
  values: number[]
  hours: string[]
}

export interface NetLoadPoint {
  hour: string
  net_in: number
  net_out: number
  load_avg: number
}

export interface DbHealth {
  status: string
  data_source: string
  mysql_configured: boolean
  mysql_connected: boolean
  message: string
}
