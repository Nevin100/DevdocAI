import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import get_settings
from db.database import init_db
from vectorstore.qdrant_store import ensure_collection_exists

settings = get_settings()

os.environ["LANGCHAIN_TRACING_V2"] = str(settings.LANGCHAIN_TRACING_V2).lower()
os.environ["LANGCHAIN_API_KEY"] = settings.LANGCHAIN_API_KEY
os.environ["LANGCHAIN_PROJECT"] = settings.LANGCHAIN_PROJECT

from auth.routes import router as auth_router
from webhooks.github_pr import router as webhook_router
from repos.routes import router as repos_router
from pipeline.routes import router as pipeline_router
from chat.routes import router as chat_router

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting up {settings.APP_NAME} v{settings.APP_VERSION}")
    await init_db()
    print("Database initialized.. Tables created..")
    await ensure_collection_exists()
    yield
    print(f"Shutting down {settings.APP_NAME} v{settings.APP_VERSION}")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(webhook_router, prefix="/webhooks", tags=["Webhooks"])
app.include_router(repos_router, tags=["Repos"])
app.include_router(pipeline_router, tags=["Pipeline"])
app.include_router(chat_router, tags=["Chat"])


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}