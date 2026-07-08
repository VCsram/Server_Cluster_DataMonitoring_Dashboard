from pydantic import BaseModel, Field


class HostInfo(BaseModel):
    hostid: str
    hostname: str
    owner: str
    model: str
    location1: str
    location2: str
    status: str = "online"
    cpu_usage: float | None = None
    mem_used: float | None = None


class OverviewResponse(BaseModel):
    host_count: int
    online_rate: float
    alert_count: int
    avg_cpu: float
    avg_mem: float
    time_range_start: str
    time_range_end: str
    data_source: str


class DistributionItem(BaseModel):
    name: str
    value: int


class DistributionResponse(BaseModel):
    by_location: list[DistributionItem]
    by_model: list[DistributionItem]
    by_owner: list[DistributionItem]


class TrendPoint(BaseModel):
    hour: str
    cpu_avg: float
    mem_avg: float


class TrendResponse(BaseModel):
    points: list[TrendPoint]
    hostid: str | None = None


class HeatmapCell(BaseModel):
    hostid: str
    hour: str
    value: float


class HeatmapResponse(BaseModel):
    hosts: list[str]
    hours: list[str]
    cells: list[HeatmapCell]


class DiskTopItem(BaseModel):
    hostid: str
    mod: str
    value: float
    desc: str
    unit: str


class DiskScatterPoint(BaseModel):
    hostid: str
    mod: str
    util: float
    await_ms: float


class DiskTopResponse(BaseModel):
    top_util: list[DiskTopItem]
    scatter: list[DiskScatterPoint]


class DiskTimelinePoint(BaseModel):
    time: str
    hostid: str
    mod: str
    value: float
    tag: str


class DiskTimelineResponse(BaseModel):
    points: list[DiskTimelinePoint]


class AlertItem(BaseModel):
    time: str
    hostid: str
    hostname: str
    metric: str
    desc: str
    value: float
    unit: str
    level: str


class AlertResponse(BaseModel):
    alerts: list[AlertItem]
    total: int


class SparklineSeries(BaseModel):
    hostid: str
    values: list[float]
    hours: list[str]


class SparklineResponse(BaseModel):
    series: list[SparklineSeries]


class NetLoadPoint(BaseModel):
    hour: str
    net_in: float
    net_out: float
    load_avg: float


class NetLoadResponse(BaseModel):
    points: list[NetLoadPoint]


class DbHealthResponse(BaseModel):
    status: str
    data_source: str
    mysql_configured: bool
    mysql_connected: bool
    message: str
