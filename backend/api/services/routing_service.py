from routing_engine.src.get_user_routes_and_best_path import get_user_routes_and_best_path
from routing_engine.src.errors.errors import NonTollRouteError
from fastapi import HTTPException, status
from models.route_models import RouteRequest, RouteResponse

def compute_route(request: RouteRequest) -> RouteResponse:
    try:
        result = get_user_routes_and_best_path(
            request.origin,
            request.destination,
            request.departure_dttm,
            request.budget
        )
    except NonTollRouteError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    response = RouteResponse(potential_routes=result[0], best_route_segments=result[1])
    return response