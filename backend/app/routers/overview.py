from fastapi import APIRouter

from app.services.datasource.mysql_source import get_data_source

router = APIRouter(prefix="/overview", tags=["overview"])


@router.get("")
def overview():
    return get_data_source().get_overview()
