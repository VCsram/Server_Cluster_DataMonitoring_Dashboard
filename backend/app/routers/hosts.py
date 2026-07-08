from fastapi import APIRouter

from app.services.datasource.mysql_source import get_data_source

router = APIRouter(prefix="/hosts", tags=["hosts"])


@router.get("")
def list_hosts():
    return get_data_source().get_hosts()


@router.get("/distribution")
def host_distribution():
    return get_data_source().get_distribution()
