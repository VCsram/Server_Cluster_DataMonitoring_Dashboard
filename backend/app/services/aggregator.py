from collections import defaultdict
from statistics import mean

from app.services.reader import get_reader


def _dr():
    return get_reader()


def _pref_rows(hostid: str | None = None, mod: str | None = None) -> list[dict]:
    rows = _dr().get_pref_tsar()
    if hostid:
        rows = [r for r in rows if r["hostid"] == hostid]
    if mod:
        rows = [r for r in rows if r["mod"] == mod]
    return list(rows)


def _disk_rows(hostid: str | None = None, mod: str | None = None, tag: str | None = None) -> list[dict]:
    rows = _dr().get_disk_tsar()
    if hostid:
        rows = [r for r in rows if r["hostid"] == hostid]
    if mod:
        rows = [r for r in rows if r["mod"] == mod]
    if tag:
        rows = [r for r in rows if r["tag"] == tag]
    return list(rows)


def get_time_range() -> tuple[str, str]:
    all_ts = [int(r["ts"]) for r in _dr().get_pref_tsar()]
    all_ts.extend(int(r["ts"]) for r in _dr().get_disk_tsar())
    if not all_ts:
        return "", ""
    return _dr().fmt_ts(min(all_ts)), _dr().fmt_ts(max(all_ts))


def get_overview() -> dict:
    hosts = _dr().get_hosts()
    cpu_rows = _pref_rows(mod="cpu_usage")
    mem_rows = _pref_rows(mod="mem_used")
    disk_util_rows = _disk_rows(tag="disk_util_percent")

    avg_cpu = mean(float(r["value"]) for r in cpu_rows) if cpu_rows else 0.0
    avg_mem = mean(float(r["value"]) for r in mem_rows) if mem_rows else 0.0

    alert_count = 0
    for r in cpu_rows:
        if float(r["value"]) > 80:
            alert_count += 1
    for r in disk_util_rows:
        if float(r["value"]) > 90:
            alert_count += 1

    start, end = get_time_range()
    return {
        "host_count": len(hosts),
        "online_rate": 100.0,
        "alert_count": alert_count,
        "avg_cpu": round(avg_cpu, 2),
        "avg_mem": round(avg_mem, 2),
        "time_range_start": start,
        "time_range_end": end,
    }


def get_hosts_with_metrics() -> list[dict]:
    host_map = _dr().host_lookup()
    latest: dict[str, dict[str, float]] = defaultdict(dict)
    for r in _pref_rows(mod="cpu_usage"):
        latest[r["hostid"]]["cpu_usage"] = float(r["value"])
    for r in _pref_rows(mod="mem_used"):
        latest[r["hostid"]]["mem_used"] = float(r["value"])

    result = []
    for h in _dr().get_hosts():
        hid = h["hostid"]
        metrics = latest.get(hid, {})
        cpu = metrics.get("cpu_usage", 0)
        status = "alert" if cpu > 80 else "online"
        result.append({
            **h,
            "status": status,
            "cpu_usage": round(cpu, 2),
            "mem_used": round(metrics.get("mem_used", 0), 2),
        })
    return result


def get_distribution() -> dict:
    by_location: dict[str, int] = defaultdict(int)
    by_model: dict[str, int] = defaultdict(int)
    by_owner: dict[str, int] = defaultdict(int)
    for h in _dr().get_hosts():
        by_location[h["location1"]] += 1
        by_model[h["model"]] += 1
        by_owner[h["owner"]] += 1

    def to_items(d: dict[str, int]) -> list[dict]:
        return [{"name": k, "value": v} for k, v in sorted(d.items(), key=lambda x: -x[1])]

    return {
        "by_location": to_items(by_location),
        "by_model": to_items(by_model),
        "by_owner": to_items(by_owner),
    }


def get_pref_trend(hostid: str | None = None) -> list[dict]:
    buckets: dict[str, dict[str, list[float]]] = defaultdict(lambda: {"cpu": [], "mem": []})
    for r in _pref_rows(hostid=hostid, mod="cpu_usage"):
        buckets[_dr().hour_key(r["ts"])]["cpu"].append(float(r["value"]))
    for r in _pref_rows(hostid=hostid, mod="mem_used"):
        buckets[_dr().hour_key(r["ts"])]["mem"].append(float(r["value"]))

    points = []
    for hour in sorted(buckets.keys()):
        b = buckets[hour]
        points.append({
            "hour": hour,
            "cpu_avg": round(mean(b["cpu"]), 2) if b["cpu"] else 0,
            "mem_avg": round(mean(b["mem"]), 2) if b["mem"] else 0,
        })
    return points


def get_cpu_heatmap() -> dict:
    hosts = [h["hostid"] for h in _dr().get_hosts()]
    hour_set: set[str] = set()
    cell_map: dict[tuple[str, str], list[float]] = defaultdict(list)

    for r in _pref_rows(mod="cpu_usage"):
        h = _dr().hour_key(r["ts"])
        hour_set.add(h)
        cell_map[(r["hostid"], h)].append(float(r["value"]))

    hours = sorted(hour_set)[-24:] if len(hour_set) > 24 else sorted(hour_set)
    cells = []
    for hostid in hosts:
        for hour in hours:
            vals = cell_map.get((hostid, hour), [])
            cells.append({
                "hostid": hostid,
                "hour": hour,
                "value": round(mean(vals), 2) if vals else 0,
            })

    return {"hosts": hosts, "hours": hours, "cells": cells}


def get_disk_top() -> dict:
    mod_map = _dr().mod_lookup()
    util_rows = _disk_rows(tag="disk_util_percent")
    latest_util: dict[tuple[str, str], tuple[int, float]] = {}
    for r in util_rows:
        key = (r["hostid"], r["mod"])
        ts = int(r["ts"])
        if key not in latest_util or ts > latest_util[key][0]:
            latest_util[key] = (ts, float(r["value"]))

    top_util = []
    for (hostid, mod), (_, val) in sorted(latest_util.items(), key=lambda x: -x[1][1])[:10]:
        m = mod_map.get(mod, {})
        top_util.append({
            "hostid": hostid,
            "mod": mod,
            "value": round(val, 2),
            "desc": m.get("desc", mod),
            "unit": m.get("unit", "%"),
        })

    await_map: dict[tuple[str, str], float] = {}
    for r in _disk_rows(tag="disk_latency_ms"):
        if "await" in r["mod"]:
            key = (r["hostid"], r["mod"].replace("_await", "_util"))
            await_map[key] = float(r["value"])

    scatter = []
    for (hostid, mod), (_, util) in latest_util.items():
        await_ms = await_map.get((hostid, mod), 0)
        scatter.append({
            "hostid": hostid,
            "mod": mod,
            "util": round(util, 2),
            "await_ms": round(await_ms, 2),
        })

    return {"top_util": top_util, "scatter": scatter[:50]}


def get_disk_timeline(hostid: str | None = None, limit: int = 200) -> list[dict]:
    rows = _disk_rows(hostid=hostid)
    rows.sort(key=lambda r: int(r["ts"]), reverse=True)
    points = []
    for r in rows[:limit]:
        points.append({
            "time": _dr().fmt_ts(r["ts"]),
            "hostid": r["hostid"],
            "mod": r["mod"],
            "value": round(float(r["value"]), 2),
            "tag": r["tag"],
        })
    points.reverse()
    return points


def get_alerts(limit: int = 50) -> list[dict]:
    mod_map = _dr().mod_lookup()
    host_map = _dr().host_lookup()
    alerts = []

    for r in _pref_rows(mod="cpu_usage"):
        val = float(r["value"])
        if val > 80:
            alerts.append({
                "time": _dr().fmt_ts(r["ts"]),
                "hostid": r["hostid"],
                "hostname": host_map.get(r["hostid"], {}).get("hostname", r["hostid"]),
                "metric": r["mod"],
                "desc": mod_map.get(r["mod"], {}).get("desc", "CPU使用率"),
                "value": round(val, 2),
                "unit": "%",
                "level": "critical" if val > 90 else "warning",
            })

    for r in _disk_rows(tag="disk_util_percent"):
        val = float(r["value"])
        if val > 90:
            alerts.append({
                "time": _dr().fmt_ts(r["ts"]),
                "hostid": r["hostid"],
                "hostname": host_map.get(r["hostid"], {}).get("hostname", r["hostid"]),
                "metric": r["mod"],
                "desc": mod_map.get(r["mod"], {}).get("desc", "磁盘利用率"),
                "value": round(val, 2),
                "unit": "%",
                "level": "critical",
            })

    alerts.sort(key=lambda x: x["time"], reverse=True)
    return alerts[:limit]


def get_sparklines() -> list[dict]:
    hosts = [h["hostid"] for h in _dr().get_hosts()]
    buckets: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))

    for r in _pref_rows(mod="cpu_usage"):
        buckets[r["hostid"]][_dr().hour_key(r["ts"])].append(float(r["value"]))

    series = []
    for hostid in hosts:
        hour_data = buckets[hostid]
        hours = sorted(hour_data.keys())[-24:]
        values = [round(mean(hour_data[h]), 2) if hour_data[h] else 0 for h in hours]
        series.append({"hostid": hostid, "hours": hours, "values": values})
    return series


def get_net_load() -> list[dict]:
    buckets: dict[str, dict[str, list[float]]] = defaultdict(
        lambda: {"net_in": [], "net_out": [], "load": []}
    )
    for r in _pref_rows(mod="net_in"):
        buckets[_dr().hour_key(r["ts"])]["net_in"].append(float(r["value"]))
    for r in _pref_rows(mod="net_out"):
        buckets[_dr().hour_key(r["ts"])]["net_out"].append(float(r["value"]))
    for r in _pref_rows(mod="load1"):
        buckets[_dr().hour_key(r["ts"])]["load"].append(float(r["value"]))

    points = []
    for hour in sorted(buckets.keys())[-48:]:
        b = buckets[hour]
        points.append({
            "hour": hour,
            "net_in": round(mean(b["net_in"]), 2) if b["net_in"] else 0,
            "net_out": round(mean(b["net_out"]), 2) if b["net_out"] else 0,
            "load_avg": round(mean(b["load"]), 2) if b["load"] else 0,
        })
    return points


def get_disk_gauges(hostid: str | None = None) -> list[dict]:
    mod_map = _dr().mod_lookup()
    util_mods = [m["mod"] for m in _dr().get_mods() if m["tag"] == "disk_util_percent"]
    latest: dict[str, tuple[int, float]] = {}
    for r in _disk_rows(hostid=hostid, tag="disk_util_percent"):
        if r["mod"] in util_mods:
            ts = int(r["ts"])
            if r["mod"] not in latest or ts > latest[r["mod"]][0]:
                latest[r["mod"]] = (ts, float(r["value"]))

    gauges = []
    for mod in util_mods:
        if mod in latest:
            m = mod_map.get(mod, {})
            gauges.append({
                "mod": mod,
                "desc": m.get("desc", mod),
                "value": round(latest[mod][1], 2),
                "unit": m.get("unit", "%"),
            })
    return sorted(gauges, key=lambda x: x["mod"])
