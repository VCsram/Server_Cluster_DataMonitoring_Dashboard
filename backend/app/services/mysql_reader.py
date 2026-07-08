"""MySQL 数据读取，接口与 dat_reader 保持一致。"""

from datetime import datetime, timedelta, timezone
from functools import lru_cache

import pymysql

from app.config import get_settings

CN_TZ = timezone(timedelta(hours=8))


def _connect():
    settings = get_settings()
    if not settings.mysql_database:
        raise ConnectionError("MySQL 数据库尚未配置，请设置 MYSQL_DATABASE=tsar_monitor")
    return pymysql.connect(
        host=settings.mysql_host,
        port=settings.mysql_port,
        user=settings.mysql_user,
        password=settings.mysql_password,
        database=settings.mysql_database,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


def _rows(sql: str, params: tuple | None = None) -> tuple[dict[str, str], ...]:
    conn = _connect()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            rows = cur.fetchall()
            return tuple({k: str(v) if v is not None else "" for k, v in row.items()} for row in rows)
    finally:
        conn.close()


def ms_to_datetime(ts_ms: int | str) -> datetime:
    return datetime.fromtimestamp(int(ts_ms) / 1000, tz=CN_TZ)


def fmt_ts(ts_ms: int | str) -> str:
    return ms_to_datetime(ts_ms).strftime("%Y-%m-%d %H:%M:%S")


def hour_key(ts_ms: int | str) -> str:
    return ms_to_datetime(ts_ms).strftime("%Y-%m-%d %H:00")


@lru_cache(maxsize=1)
def get_hosts() -> tuple[dict, ...]:
    return _rows(
        "SELECT hostid, hostname, owner, model, location1, location2 FROM host_detail ORDER BY hostid"
    )


@lru_cache(maxsize=1)
def get_mods() -> tuple[dict, ...]:
    return _rows("SELECT `mod`, type, `desc`, unit, tag FROM mod_detail ORDER BY `mod`")


@lru_cache(maxsize=1)
def get_pref_tsar() -> tuple[dict, ...]:
    return _rows(
        "SELECT ts, hostid, type, `mod`, value, tag FROM pref_tsar ORDER BY ts, hostid, `mod`"
    )


@lru_cache(maxsize=1)
def get_disk_tsar() -> tuple[dict, ...]:
    return _rows(
        "SELECT ts, hostid, type, `mod`, value, tag FROM disk_tsar ORDER BY ts, hostid, `mod`"
    )


def mod_lookup() -> dict[str, dict]:
    return {m["mod"]: m for m in get_mods()}


def host_lookup() -> dict[str, dict]:
    return {h["hostid"]: h for h in get_hosts()}


def clear_cache() -> None:
    get_hosts.cache_clear()
    get_mods.cache_clear()
    get_pref_tsar.cache_clear()
    get_disk_tsar.cache_clear()


def ping() -> None:
    conn = _connect()
    conn.close()
