"""按配置返回 dat / mysql 数据读取模块。"""

from app.config import get_settings


def get_reader():
    settings = get_settings()
    if settings.data_source == "mysql":
        from app.services import mysql_reader as reader
    else:
        from app.services import dat_reader as reader
    return reader


def get_source_label() -> str:
    return get_settings().data_source
