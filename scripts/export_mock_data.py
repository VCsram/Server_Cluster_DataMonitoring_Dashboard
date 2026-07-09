# -*- coding: utf-8 -*-
"""从项目 data/*.dat 导出前端离线 mock JSON。"""
import json
import os
import sys
from pathlib import Path

os.environ.setdefault("DATA_SOURCE", "dat")

BACKEND = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND))

from app.config import get_settings  # noqa: E402
from app.services import aggregator  # noqa: E402

get_settings.cache_clear()

OUT = Path(__file__).resolve().parent.parent / "frontend" / "src" / "mock" / "data.json"


def main():
    payload = {
        "overview": {**aggregator.get_overview(), "data_source": "local"},
        "hosts": aggregator.get_hosts_with_metrics(),
        "distribution": aggregator.get_distribution(),
        "trend": {"points": aggregator.get_pref_trend(), "hostid": None},
        "heatmap": aggregator.get_cpu_heatmap(),
        "diskTop": aggregator.get_disk_top(),
        "diskGauges": aggregator.get_disk_gauges(),
        "alerts": {"alerts": aggregator.get_alerts(), "total": len(aggregator.get_alerts())},
        "sparklines": {"series": aggregator.get_sparklines()},
        "netLoad": {"points": aggregator.get_net_load()},
        "dbHealth": {
            "status": "ok",
            "data_source": "local",
            "mysql_configured": True,
            "mysql_connected": False,
            "message": "后端未启动，使用本地 .dat 快照数据",
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Exported mock data -> {OUT}")
    print(f"  overview hosts: {payload['overview']['host_count']}")
    print(f"  alerts: {payload['alerts']['total']}")


if __name__ == "__main__":
    main()
