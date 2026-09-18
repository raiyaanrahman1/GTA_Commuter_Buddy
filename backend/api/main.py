from contextlib import asynccontextmanager
from typing import AsyncGenerator, TypedDict

import redis.asyncio as redis
import uvicorn

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from misc.limiter import (
    REDIS_URL,
    RouteRateLimiters,
    create_route_rate_limiters,
)
from misc.sliding_ttl_cache import SlidingTTLCache
from misc.types import RouteState
from routing_engine.src.build_user_route_graph import RouteGraphBuilder
from routes.routes import router


class StateDict(TypedDict):
    route_builder: RouteGraphBuilder
    route_cache: SlidingTTLCache
    rate_limiters: RouteRateLimiters


@asynccontextmanager
async def lifespan(
    app: FastAPI,
) -> AsyncGenerator[StateDict]:
    print("Loading route graph into memory...")

    route_graph_builder = RouteGraphBuilder()

    route_cache: SlidingTTLCache[str, RouteState] = SlidingTTLCache(
        maxsize=100,
        ttl=300,
    )

    redis_client = redis.from_url(
        REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )

    try:
        await redis_client.ping()
    except Exception as exc:
        await redis_client.aclose()

        raise RuntimeError(
            "Could not connect to Redis. "
            "Please verify that Redis is running."
        ) from exc

    print("Redis connection verified successfully!")

    rate_limiters = create_route_rate_limiters(
        redis_client,
    )

    yield {
        "route_builder": route_graph_builder,
        "route_cache": route_cache,
        "rate_limiters": rate_limiters,
    }

    print("Shutting down and cleaning up resources...")

    route_cache.clear()
    rate_limiters.close()

    await redis_client.aclose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="GTA Commuter Buddy API",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.include_router(
        router,
        prefix="/api",
    )

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
        reload_dirs=[".", "../routing_engine/src"],
    )