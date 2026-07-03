from fastapi import APIRouter, Request, Depends

from services.routing_service import compute_route
from models.route_models import RouteRequest, RouteResponse
from misc.sliding_ttl_cache import SlidingTTLCache
from routing_engine.src.build_user_route_graph import RouteGraphBuilder

router = APIRouter()

def get_route_builder(request: Request) -> RouteGraphBuilder:
    return request.state.route_builder

def get_route_cache(request: Request) -> SlidingTTLCache:
    return request.state.route_cache


@router.post("/route")
def get_route(
    request: RouteRequest,
    builder: RouteGraphBuilder = Depends(get_route_builder),
    route_cache: SlidingTTLCache = Depends(get_route_cache)
) -> RouteResponse:
    result = compute_route(request, builder, route_cache)
    return result