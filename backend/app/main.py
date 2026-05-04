import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app import __version__
from app.config import settings
from app.database import engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("schemapilot")


def create_app() -> FastAPI:
    app = FastAPI(title="SchemaPilot", version=__version__)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health() -> dict[str, str]:
        db_ok = "ok"
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
        except Exception as e:  # noqa: BLE001
            log.warning("db healthcheck failed: %s", e)
            db_ok = "error"
        return {"status": "ok", "db": db_ok, "version": __version__}

    log.info("schemapilot started, cors=%s", settings.cors_origins)
    return app


app = create_app()
