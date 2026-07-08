from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import health, hosts, metrics, overview

app = FastAPI(
    title="服务器集群监控 API",
    description="数据监控大屏后端，支持 .dat 文件与 MySQL 数据源切换",
    version="1.0.0",
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(overview.router, prefix="/api/v1")
app.include_router(hosts.router, prefix="/api/v1")
app.include_router(metrics.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "服务器集群监控 API", "docs": "/docs"}
