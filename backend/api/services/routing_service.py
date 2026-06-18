from routing_engine.src.get_user_routes_and_best_path import get_user_routes_and_best_path
from routing_engine.src.errors.errors import NonTollRouteError
from routing_engine.src.types.types import PolylineType
from fastapi import HTTPException, status
from models.route_models import RouteRequest, RouteResponse
from routing_engine.src.build_user_route_graph import RouteGraphBuilder


def to_geojson_feature(coords: PolylineType, status: str):
    # Swap [lat, lng] to [lng, lat] for Mapbox/GeoJSON
    swapped_coords = [[lng, lat] for lat, lng in coords]
    return {
        "type": "Feature",
        "properties": { "route_type": status },
        "geometry": {
            "type": "LineString",
            "coordinates": swapped_coords
        }
    }

def build_feature_collection(best_routes: list[PolylineType], potential_routes: list[PolylineType] | None = None):
    features = []
    
    # Add potential routes
    if potential_routes is not None:
        for route in potential_routes:
            features.append(to_geojson_feature(route, "potential"))
        
    # Add best segments
    for route in best_routes:
        features.append(to_geojson_feature(route, "best"))

    return RouteResponse(features=features)

def compute_route(request: RouteRequest, builder: RouteGraphBuilder) -> RouteResponse:
    try:
        potential_routes, best_route_segments, _ = get_user_routes_and_best_path(
            request.origin,
            request.destination,
            request.departure_dttm,
            request.budget,
            builder
        )
    except NonTollRouteError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    response = build_feature_collection(best_route_segments, potential_routes)
    
    return response