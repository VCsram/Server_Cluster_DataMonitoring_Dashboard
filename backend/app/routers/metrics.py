from fastapi import APIRouter, Query

from app.services.datasource.mysql_source import get_data_source

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/pref/trend")
def pref_trend(hostid: str | None = Query(None)):
    return get_data_source().get_pref_trend(hostid)


@router.get("/pref/heatmap")
def pref_heatmap():
    return get_data_source().get_cpu_heatmap()


@router.get("/disk/top")
def disk_top():
    return get_data_source().get_disk_top()


@router.get("/disk/timeline")
def disk_timeline(hostid: str | None = Query(None)):
    return get_data_source().get_disk_timeline(hostid)


@router.get("/disk/gauges")
def disk_gauges(hostid: str | None = Query(None)):
    return get_data_source().get_disk_gauges(hostid)


@router.get("/sparklines")
def sparklines():
    return get_data_source().get_sparklines()


@router.get("/net-load")
def net_load():
    return get_data_source().get_net_load()
