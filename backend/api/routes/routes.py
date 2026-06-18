from fastapi import APIRouter, Request, Depends
from services.routing_service import compute_route
from models.route_models import RouteRequest, RouteResponse
from routing_engine.src.build_user_route_graph import RouteGraphBuilder

router = APIRouter()

def get_route_builder(request: Request) -> RouteGraphBuilder:
    return request.app.state.route_builder

@router.post("/route")
def get_route(
    request: RouteRequest,
    builder: RouteGraphBuilder = Depends(get_route_builder)
) -> RouteResponse:
    result = compute_route(request, builder)
    return result