from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    Response,
    status,
)

from services.routing_service import compute_route
from models.route_models import RouteRequest, RouteResponse
from misc.sliding_ttl_cache import SlidingTTLCache
from misc.types import RouteState
from routing_engine.src.build_user_route_graph import RouteGraphBuilder

router = APIRouter()


def get_route_builder(
    request: Request,
) -> RouteGraphBuilder:
    return request.state.route_builder


def get_route_cache(
    request: Request,
) -> SlidingTTLCache[str, RouteState]:
    return request.state.route_cache


@router.post("/route")
async def get_route(
    request: Request,
    response: Response,
    data: RouteRequest,
    builder: RouteGraphBuilder = Depends(get_route_builder),
    route_cache: SlidingTTLCache[str, RouteState] = Depends(
        get_route_cache
    ),
) -> RouteResponse:
    try:
        return await compute_route(
            request=data,
            builder=builder,
            route_cache=route_cache,
            http_request=request,
            http_response=response,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Something went wrong on our end, "
                "please try again later or report this issue"
            ),
        ) from exc