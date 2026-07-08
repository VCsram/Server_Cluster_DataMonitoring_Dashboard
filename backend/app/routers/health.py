from fastapi import APIRouter

from app.services.datasource.mysql_source import check_db_health, get_data_source

router = APIRouter(tags=["health"])


@router.get("/alerts")
def alerts():
    return get_data_source().get_alerts()


@router.get("/health/db")
def db_health():
    return check_db_health()
