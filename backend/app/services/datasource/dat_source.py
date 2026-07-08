from app.services.datasource.mysql_source import DataSource, check_db_health, get_data_source

__all__ = ["DatFileDataSource", "get_data_source", "check_db_health"]

# 兼容旧引用
DatFileDataSource = DataSource
