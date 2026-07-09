from app.config import get_settings
from app.schemas.response import (
    AlertItem,
    AlertResponse,
    DbHealthResponse,
    DistributionItem,
    DistributionResponse,
    DiskScatterPoint,
    DiskTimelinePoint,
    DiskTimelineResponse,
    DiskTopItem,
    DiskTopResponse,
    HeatmapCell,
    HeatmapResponse,
    HostInfo,
    NetLoadPoint,
    NetLoadResponse,
    OverviewResponse,
    SparklineResponse,
    SparklineSeries,
    TrendPoint,
    TrendResponse,
)
from app.services import aggregator
from app.services.reader import get_source_label, refresh_mysql_status


class DataSource:
    def _label(self) -> str:
        return get_source_label()

    def get_overview(self) -> OverviewResponse:
        data = aggregator.get_overview()
        data["data_source"] = self._label()
        return OverviewResponse(**data)

    def get_hosts(self) -> list[HostInfo]:
        return [HostInfo(**h) for h in aggregator.get_hosts_with_metrics()]

    def get_distribution(self) -> DistributionResponse:
        d = aggregator.get_distribution()
        return DistributionResponse(
            by_location=[DistributionItem(**x) for x in d["by_location"]],
            by_model=[DistributionItem(**x) for x in d["by_model"]],
            by_owner=[DistributionItem(**x) for x in d["by_owner"]],
        )

    def get_pref_trend(self, hostid: str | None = None) -> TrendResponse:
        points = [TrendPoint(**p) for p in aggregator.get_pref_trend(hostid)]
        return TrendResponse(points=points, hostid=hostid)

    def get_cpu_heatmap(self) -> HeatmapResponse:
        d = aggregator.get_cpu_heatmap()
        return HeatmapResponse(
            hosts=d["hosts"],
            hours=d["hours"],
            cells=[HeatmapCell(**c) for c in d["cells"]],
        )

    def get_disk_top(self) -> DiskTopResponse:
        d = aggregator.get_disk_top()
        return DiskTopResponse(
            top_util=[DiskTopItem(**x) for x in d["top_util"]],
            scatter=[DiskScatterPoint(**x) for x in d["scatter"]],
        )

    def get_disk_timeline(self, hostid: str | None = None) -> DiskTimelineResponse:
        points = [DiskTimelinePoint(**p) for p in aggregator.get_disk_timeline(hostid)]
        return DiskTimelineResponse(points=points)

    def get_alerts(self) -> AlertResponse:
        alerts = [AlertItem(**a) for a in aggregator.get_alerts()]
        return AlertResponse(alerts=alerts, total=len(alerts))

    def get_sparklines(self) -> SparklineResponse:
        series = [SparklineSeries(**s) for s in aggregator.get_sparklines()]
        return SparklineResponse(series=series)

    def get_net_load(self) -> NetLoadResponse:
        points = [NetLoadPoint(**p) for p in aggregator.get_net_load()]
        return NetLoadResponse(points=points)

    def get_disk_gauges(self, hostid: str | None = None) -> list[dict]:
        return aggregator.get_disk_gauges(hostid)


def get_data_source() -> DataSource:
    return DataSource()


def check_db_health() -> DbHealthResponse:
    settings = get_settings()
    mysql_configured = bool(settings.mysql_database)
    active_source = "dat"
    mysql_connected = False
    message = "当前使用 .dat 预存数据"

    if settings.data_source == "mysql":
        if not mysql_configured:
            message = "MySQL 已选为数据源，但 MYSQL_DATABASE 未配置"
        else:
            mysql_connected = refresh_mysql_status()
            if mysql_connected:
                active_source = "mysql"
                message = "MySQL 连接成功"
            else:
                try:
                    from app.services import dat_reader

                    dat_reader.get_hosts()
                    active_source = "dat"
                    message = "MySQL 不可用，已自动切换 .dat 预存数据"
                except Exception as exc:
                    message = f"MySQL 连接失败且 .dat 不可用: {exc}"
    elif settings.data_source == "dat":
        message = "当前使用 .dat 预存数据"

    ok = active_source == "dat" or mysql_connected
    return DbHealthResponse(
        status="ok" if ok else "degraded",
        data_source=active_source,
        mysql_configured=mysql_configured,
        mysql_connected=mysql_connected,
        message=message,
    )

