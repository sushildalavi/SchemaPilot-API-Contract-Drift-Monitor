import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("schemapilot")


def create_app() -> FastAPI:
    app = FastAPI(
        title="SchemaPilot",
        version=__version__,
        description="API Contract Drift Monitor",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    from app.api import (
        routes_changelog,
        routes_diffs,
        routes_endpoints,
        routes_health,
        routes_monitor,
        routes_snapshots,
    )

    app.include_router(routes_health.router)
    app.include_router(routes_endpoints.router)
    app.include_router(routes_snapshots.router)
    app.include_router(routes_diffs.router)
    app.include_router(routes_monitor.router)
    app.include_router(routes_changelog.router)

    log.info("schemapilot started, cors=%s", settings.cors_origins)
    return app


app = create_app()
