from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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


@app.get("/")
@app.get("/api")
@app.get("/api/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }

