from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.routers.health import router as health_router

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
app.include_router(health_router, prefix="/api")
app.include_router(health_router) # also at root /health

from app.routers.auth import router as auth_router
from app.routers.customers import router as customers_router
from app.routers.professionals import router as professionals_router
from app.routers.services import router as services_router
from app.routers.bookings import router as bookings_router
from app.routers.availability import router as availability_router
from app.routers.admin import router as admin_router
from app.routers.super_admin import router as super_admin_router

app.include_router(auth_router, prefix="/api")
app.include_router(customers_router, prefix="/api")
app.include_router(professionals_router, prefix="/api")
app.include_router(services_router, prefix="/api")
app.include_router(bookings_router, prefix="/api")
app.include_router(availability_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(super_admin_router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }

