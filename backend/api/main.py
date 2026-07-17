from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routing_engine.src.build_user_route_graph import RouteGraphBuilder
from typing import AsyncIterator, TypedDict
import uvicorn

from routes.routes import router
from misc.sliding_ttl_cache import SlidingTTLCache
from misc.types import RouteState

class StateDict(TypedDict):
    route_builder: RouteGraphBuilder
    route_cache: SlidingTTLCache

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[StateDict]:
    # Startup
    print("Loading route graph into memory...")
    route_graph_builder = RouteGraphBuilder()
    TTL = 300  # 5 minutes
    route_cache: SlidingTTLCache[str, RouteState] = SlidingTTLCache(maxsize=100, ttl=TTL)
    
    # Note: passing in state variables directly into yield makes them only accessible in requests
    # They become merged into every request, but they are part of the request state, not the app state
    yield {
        'route_builder': route_graph_builder,
        'route_cache': route_cache,
    }
    
    # Shutdown
    print("Shutting down and cleaning up resources...")
    route_cache.clear()

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