"""
Main FastAPI application entry point.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from database import init_db
from routes import auth, tiers, features, admin, health
from exceptions import AuthenticationError, AuthorizationError, NotFoundError, ValidationError

app = FastAPI(title="SaaS Starter Kit API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handlers
@app.exception_handler(AuthenticationError)
async def authentication_error_handler(request: Request, exc: AuthenticationError):
    return JSONResponse(
        status_code=401,
        content={"error": "Unauthorized", "message": str(exc)}
    )


@app.exception_handler(AuthorizationError)
async def authorization_error_handler(request: Request, exc: AuthorizationError):
    return JSONResponse(
        status_code=403,
        content={"error": "Forbidden", "message": str(exc)}
    )


@app.exception_handler(NotFoundError)
async def not_found_error_handler(request: Request, exc: NotFoundError):
    return JSONResponse(
        status_code=404,
        content={"error": "Not Found", "message": str(exc)}
    )


@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=400,
        content={"error": "Bad Request", "message": str(exc)}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "message": "An unexpected error occurred"}
    )


# Include routers
app.include_router(auth.router)
app.include_router(tiers.router)
app.include_router(features.router)
app.include_router(admin.router)
app.include_router(health.router)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()
    # Seed database with initial data
    from seed import seed_database
    seed_database()


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "SaaS Starter Kit API"}
