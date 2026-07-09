"""按配置返回 dat / mysql 数据读取模块；MySQL 不可用时自动降级 .dat。"""

from app.config import get_settings

_mysql_connected: bool | None = None


def refresh_mysql_status() -> bool:
    """探测 MySQL 是否可用；DATA_SOURCE=dat 时不探测。"""
    global _mysql_connected
    settings = get_settings()
    if settings.data_source != "mysql":
        _mysql_connected = None
        return False
    try:
        from app.services.mysql_reader import ping

        ping()
        _mysql_connected = True
    except Exception:
        _mysql_connected = False
    return _mysql_connected


def is_using_mysql() -> bool:
    settings = get_settings()
    if settings.data_source != "mysql":
        return False
    if _mysql_connected is None:
        refresh_mysql_status()
    return _mysql_connected is True


def get_reader():
    if is_using_mysql():
        from app.services import mysql_reader as reader
    else:
        from app.services import dat_reader as reader
    return reader


def get_source_label() -> str:
    return "mysql" if is_using_mysql() else "dat"
