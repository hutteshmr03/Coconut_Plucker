import os
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.routers.health import router as health_router
from app.core.database import Base, engine
import app.models as _models

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Validation Error Handler (standard format: {"error": {"code": "...", "message": "...", "details": ...}})
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request payload",
                "details": exc.errors()
            }
        }
    )

# Include Routers
from app.routers.auth import router as auth_router
from app.routers.customers import router as customers_router
from app.routers.professionals import router as professionals_router
from app.routers.services import router as services_router
from app.routers.bookings import router as bookings_router
from app.routers.availability import router as availability_router
from app.routers.admin import router as admin_router
from app.routers.super_admin import router as super_admin_router

api_routers = [
    auth_router,
    customers_router,
    professionals_router,
    services_router,
    bookings_router,
    availability_router,
    admin_router,
    super_admin_router,
    health_router,
]

# Mount all routers both at root (for Passenger stripped PATH_INFO) and with /api prefix
for r in api_routers:
    app.include_router(r)
    app.include_router(r, prefix="/api")


# Resolve frontend distribution directory for SPA serving (live webroot first so frontend-only deploys take effect immediately)
FRONTEND_DIR = None
for candidate in [
    "/home/nrlnxfke/paddeli.com",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend_dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "paddeli.com")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
    os.path.abspath(os.path.join(os.getcwd(), "frontend", "dist")),
]:
    if os.path.isdir(candidate) and os.path.isfile(os.path.join(candidate, "index.html")):
        FRONTEND_DIR = candidate
        break

# Mount frontend static assets if available
if FRONTEND_DIR:
    assets_dir = os.path.join(FRONTEND_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend_assets")


@app.get("/api")
@app.get("/api/")
def api_root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }


NO_CACHE_HEADERS = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
}


@app.get("/")
def serve_root():
    if FRONTEND_DIR:
        index_path = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path, media_type="text/html", headers=NO_CACHE_HEADERS)
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/{full_path:path}")
def serve_spa_fallback(full_path: str):
    # Do not catch API endpoints, health, or OpenAPI docs
    clean_path = full_path.strip("/")
    if any(clean_path == p or clean_path.startswith(p + "/") for p in ["api", "docs", "redoc", "openapi.json", "ping", "health"]):
        raise HTTPException(status_code=404, detail="Endpoint not found")

    if FRONTEND_DIR:
        # Check if requested path is a real file (e.g., logo.png, manifest.json, sw.js)
        file_path = os.path.join(FRONTEND_DIR, clean_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)

        # Never serve index.html for missing static assets
        if clean_path.startswith("assets/") or clean_path.endswith((".js", ".css", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".webp", ".woff2")):
            raise HTTPException(status_code=404, detail="Asset not found")

        # Fallback to index.html for React Router SPA routes (e.g. /customer, /admin)
        index_path = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path, media_type="text/html", headers=NO_CACHE_HEADERS)

    raise HTTPException(status_code=404, detail="Page not found")

