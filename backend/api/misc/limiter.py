from __future__ import annotations

from dataclasses import dataclass

from fastapi import Request, Response
from fastapi_limiter.depends import RateLimiter
from pyrate_limiter import (
    BucketFactory,
    Duration,
    Limiter,
    Rate,
    RateItem,
    RedisStateStore,
    StateBucket,
    TokenBucket,
)
from pyrate_limiter.clocks import WallClock
from redis.asyncio import Redis


REDIS_URL = "redis://localhost:6379/0"

GRAPH_REQUESTS_PER_MINUTE = 5
GRAPH_REQUESTS_PER_MONTH = 1_000
CACHED_REQUESTS_PER_MINUTE = 30

MONTH_LENGTH_DAYS = 30


async def client_identifier(request: Request) -> str:
    """
    Return the per-client rate-limit identifier used by cached-route
    and graph-minute limiters.

    Includes the endpoint path so limits remain isolated if additional
    API endpoints use the same limiter infrastructure later.
    """
    forwarded = request.headers.get("X-Forwarded-For")

    if forwarded:
        ip = forwarded.split(",")[0].strip()
    elif request.client:
        ip = request.client.host
    else:
        ip = "127.0.0.1"

    return f"{ip}:{request.scope['path']}"


async def global_identifier(request: Request) -> str:
    """
    Return one shared identifier for the graph-construction monthly quota.

    Every client therefore consumes the same monthly pool.
    """
    return "global:route-graph:monthly"


class RedisStateBucketFactory(BucketFactory):
    """
    Creates a Redis-backed StateBucket for each rate-limit identifier.

    Unlike RedisBucket, StateBucket stores only a small amount of state,
    making it appropriate for long-lived / high-volume rate limiting.
    """

    def __init__(
        self,
        redis: Redis,
        rates: list[Rate],
        key_prefix: str,
    ) -> None:
        self.redis = redis
        self.rates = rates
        self.key_prefix = key_prefix
        self.clock = WallClock()

    def wrap_item(
        self,
        name: str,
        weight: int = 1,
    ) -> RateItem:
        return RateItem(
            name=name,
            timestamp=self.clock.now(),
            weight=weight,
        )

    def get(
        self,
        item: RateItem,
    ) -> StateBucket:
        """
        Return a StateBucket whose Redis state is isolated by item.name.

        StateBucket itself is lightweight and stores the actual state in Redis,
        so we don't need to keep a Python-side bucket cache.
        """
        redis_key = f"{self.key_prefix}:{item.name}"

        store = RedisStateStore(
            self.redis,
            redis_key,
        )

        return StateBucket(
            rates=self.rates,
            algorithm=TokenBucket(),
            store=store,
        )


@dataclass(frozen=True)
class RouteRateLimiters:
    """
    All rate-limit policies used by the route endpoint.
    """

    graph_minute: RateLimiter
    graph_monthly: RateLimiter
    cached_route: RateLimiter

    def close(self) -> None:
        """
        Release PyrateLimiter factory resources.

        The underlying Redis connection is owned by the FastAPI lifespan,
        not by these limiters.
        """
        self.graph_minute.limiter.close()
        self.graph_monthly.limiter.close()
        self.cached_route.limiter.close()


def create_route_rate_limiters(
    redis: Redis,
) -> RouteRateLimiters:
    """
    Build the three route-specific rate limiters.

    Graph construction:
        5 requests / minute / client

    Global graph quota:
        1,000 requests / 30 days across all clients

    Cached RouteState:
        30 requests / minute / client
    """

    graph_minute = RateLimiter(
        limiter=Limiter(
            RedisStateBucketFactory(
                redis=redis,
                rates=[
                    Rate(
                        GRAPH_REQUESTS_PER_MINUTE,
                        Duration.MINUTE,
                    )
                ],
                key_prefix="gta:rate:graph-minute",
            )
        ),
        identifier=client_identifier,
        blocking=False,
    )

    graph_monthly = RateLimiter(
        limiter=Limiter(
            RedisStateBucketFactory(
                redis=redis,
                rates=[
                    Rate(
                        GRAPH_REQUESTS_PER_MONTH,
                        Duration.DAY * MONTH_LENGTH_DAYS,
                    )
                ],
                key_prefix="gta:rate:graph-monthly",
            )
        ),
        identifier=global_identifier,
        blocking=False,
    )

    cached_route = RateLimiter(
        limiter=Limiter(
            RedisStateBucketFactory(
                redis=redis,
                rates=[
                    Rate(
                        CACHED_REQUESTS_PER_MINUTE,
                        Duration.MINUTE,
                    )
                ],
                key_prefix="gta:rate:cached-route",
            )
        ),
        identifier=client_identifier,
        blocking=False,
    )

    return RouteRateLimiters(
        graph_minute=graph_minute,
        graph_monthly=graph_monthly,
        cached_route=cached_route,
    )


async def enforce_rate_limit(
    limiter: RateLimiter,
    request: Request,
    response: Response,
) -> None:
    """
    Invoke a FastAPI-Limiter RateLimiter manually.

    FastAPI-Limiter normally raises HTTP 429 through its callback when the
    dependency fails. Because we're invoking it from the routing service,
    this helper simply lets that exception propagate.
    """
    await limiter(request, response)