from urllib.parse import urlsplit

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import engine
from app.modules import auth, catalog, files, orders

app = FastAPI(
    title="Тираж API",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    redoc_url=None,
)


@app.middleware("http")
async def request_security(request: Request, call_next):
    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        origin = request.headers.get("origin")
        allowed = {get_settings().frontend_origin}
        if origin and origin not in allowed:
            return JSONResponse({"detail": "Недопустимый источник запроса"}, status_code=403)
        if request.headers.get("sec-fetch-site") == "cross-site":
            return JSONResponse({"detail": "Недопустимый источник запроса"}, status_code=403)
        referer = request.headers.get("referer")
        if not origin and referer:
            parsed = urlsplit(referer)
            if f"{parsed.scheme}://{parsed.netloc}" not in allowed:
                return JSONResponse({"detail": "Недопустимый источник запроса"}, status_code=403)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/api/health")
def health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ok"}


for router in (auth.router, catalog.router, orders.router, files.router):
    app.include_router(router, prefix="/api")
