from fastapi import APIRouter, Request, Depends, HTTPException, status

from services.routing_service import compute_route
from models.route_models import RouteRequest, RouteResponse
from misc.sliding_ttl_cache import SlidingTTLCache
from routing_engine.src.build_user_route_graph import RouteGraphBuilder
from misc.limiter import limiter, global_endpoint_counter

router = APIRouter()

def get_route_builder(request: Request) -> RouteGraphBuilder:
    return request.state.route_builder

def get_route_cache(request: Request) -> SlidingTTLCache:
    return request.state.route_cache


@router.post("/route")
@limiter.limit("1000/month", key_func=global_endpoint_counter)
@limiter.limit("5/minute")
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