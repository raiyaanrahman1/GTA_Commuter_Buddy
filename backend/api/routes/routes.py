from fastapi import APIRouter, Request, Depends, HTTPException, status

from services.routing_service import compute_route, get_route_cache_key
from models.route_models import RouteRequest, RouteResponse
from misc.sliding_ttl_cache import SlidingTTLCache
from routing_engine.src.build_user_route_graph import RouteGraphBuilder
from misc.limiter import limiter, global_endpoint_counter, request_ctx

router = APIRouter()

def get_route_builder(request: Request) -> RouteGraphBuilder:
    return request.state.route_builder

def get_route_cache(request: Request) -> SlidingTTLCache:
    return request.state.route_cache

def check_route_cache(
    request: Request,
    data: RouteRequest,
    route_cache: SlidingTTLCache = Depends(get_route_cache)
) -> None:
    request_ctx.set(request)
    cache_key = get_route_cache_key(data)
    # Check cache membership (does not alter SlidingTTLCache TTL/eviction order yet)
    request.state.is_route_cached = cache_key in route_cache

def is_route_cached(request: Request) -> bool:
    return getattr(request.state, "is_route_cached", False)

def is_route_uncached(request: Request) -> bool:
    return not is_route_cached(request)

@router.post("/route", dependencies=[Depends(check_route_cache)])
# Expensive limits: only apply on cache misses
@limiter.limit("1000/month", key_func=global_endpoint_counter, exempt_when=is_route_cached)
@limiter.limit("5/minute", exempt_when=is_route_cached)
# Safety limit: only applies on cache hits
@limiter.limit("30/minute", exempt_when=is_route_uncached)
def get_route(
    request: Request,
    data: RouteRequest,
    builder: RouteGraphBuilder = Depends(get_route_builder),
    route_cache: SlidingTTLCache = Depends(get_route_cache)
) -> RouteResponse:
    try:
        result = compute_route(data, builder, route_cache)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong on our end, please try again later or report this issue",
        )
    return result