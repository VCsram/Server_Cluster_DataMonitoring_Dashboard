import csv
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path

from app.config import DATA_DIR

CN_TZ = timezone(timedelta(hours=8))


def load_tsv(name: str) -> list[dict[str, str]]:
    path = DATA_DIR / name
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def ms_to_datetime(ts_ms: int | str) -> datetime:
    return datetime.fromtimestamp(int(ts_ms) / 1000, tz=CN_TZ)


def fmt_ts(ts_ms: int | str) -> str:
    return ms_to_datetime(ts_ms).strftime("%Y-%m-%d %H:%M:%S")


def hour_key(ts_ms: int | str) -> str:
    return ms_to_datetime(ts_ms).strftime("%Y-%m-%d %H:00")


@lru_cache(maxsize=1)
def get_hosts() -> tuple[dict, ...]:
    return tuple(load_tsv("host_detail.dat"))


@lru_cache(maxsize=1)
def get_mods() -> tuple[dict, ...]:
    return tuple(load_tsv("mod_detail.dat"))


@lru_cache(maxsize=1)
def get_pref_tsar() -> tuple[dict, ...]:
    return tuple(load_tsv("pref_tsar.dat"))


@lru_cache(maxsize=1)
def get_disk_tsar() -> tuple[dict, ...]:
    return tuple(load_tsv("disk_tsar.dat"))


def mod_lookup() -> dict[str, dict]:
    return {m["mod"]: m for m in get_mods()}


def host_lookup() -> dict[str, dict]:
    return {h["hostid"]: h for h in get_hosts()}


def clear_cache() -> None:
    get_hosts.cache_clear()
    get_mods.cache_clear()
    get_pref_tsar.cache_clear()
    get_disk_tsar.cache_clear()
