from contextlib import asynccontextmanager
from fastapi import FastAPI
from routes.routes import router
from fastapi.middleware.cors import CORSMiddleware
from routing_engine.src.build_user_route_graph import RouteGraphBuilder
import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Loading route graph into memory...")
    app.state.route_builder = RouteGraphBuilder()
    
    yield  # The application runs while paused here
    
    # Shutdown
    print("Shutting down and cleaning up resources...")

def create_app() -> FastAPI:
    app = FastAPI(
        title="GTA Commuter Buddy API",
        version="1.0.0",
        lifespan=lifespan
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

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="127.0.0.1", 
        port=8000, 
        reload=True,
        reload_dirs=[".", "../routing_engine/src"] # Watch both directories
    )