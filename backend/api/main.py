from fastapi import FastAPI
from routes.routes import router

def create_app() -> FastAPI:
    app = FastAPI(
        title="GTA Commuter Buddy API",
        version="1.0.0"
    )

    # Register API routes
    app.include_router(router, prefix="/api")

    return app

app = create_app()