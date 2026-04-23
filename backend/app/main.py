from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.core.config import settings
from app.db import create_db_and_tables, engine
from app.routers import attempts, auth, leaderboard, me, quizzes, wishlist
from app.seed import seed_if_empty


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)

    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def _startup() -> None:
        create_db_and_tables()
        with Session(engine) as session:
            seed_if_empty(session)

    api = FastAPI(title=settings.app_name)
    api.include_router(auth.router)
    api.include_router(me.router)
    api.include_router(quizzes.router)
    api.include_router(attempts.router)
    api.include_router(leaderboard.router)
    api.include_router(wishlist.router)
    app.mount(settings.api_prefix, api)

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()

