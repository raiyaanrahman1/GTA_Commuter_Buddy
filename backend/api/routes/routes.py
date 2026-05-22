from fastapi import APIRouter
from services.routing_service import compute_route
from models.route_models import RouteRequest, RouteResponse

router = APIRouter()

@router.post("/route")
def get_route(request: RouteRequest) -> RouteResponse:
    result = compute_route(request)
    return result