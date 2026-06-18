from fastapi import FastAPI
from routes.routes import router
from fastapi.middleware.cors import CORSMiddleware

def create_app() -> FastAPI:
    app = FastAPI(
        title="GTA Commuter Buddy API",
        version="1.0.0"
    )

    # Register API routes
    app.include_router(router, prefix="/api")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app

app = create_app()