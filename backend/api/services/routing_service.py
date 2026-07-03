from models.route_models import RouteRequest, RouteResponse, FeatureCollection
from misc.sliding_ttl_cache import SlidingTTLCache
from misc.types import RouteState

from routing_engine.src.get_user_routes_and_best_path import build_route_graph, compute_best_path
from routing_engine.src.errors.errors import NonTollRouteError
from routing_engine.src.types.types import PolylineType
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

    return FeatureCollection(features=features)

def compute_route(
        request: RouteRequest,
        builder: RouteGraphBuilder,
        route_cache: SlidingTTLCache[str, RouteState]
    ) -> RouteResponse:
    (
        origin,
        destination,
        departure_dttm,
        budget
    ) = (
        request.origin,
        request.destination,
        request.departure_dttm,
        request.budget
    )
    cache_key = f"{origin}:{destination}:{departure_dttm}"
    route_state: None | RouteState = None

    try:
        route_state = route_cache[cache_key]
    except KeyError:
        route_state = None

    if route_state is None:
        connected_graph = None
        best_non_toll_route = None
        potential_routes = None
        intra_route_section_data = None
        inter_route_section_data = None
        total_cost = None
        try:
            (
                connected_graph,
                intra_route_section_data,
                inter_route_section_data,
                traffic_aware_polylines,
                total_cost
            ) = build_route_graph(
                origin,
                destination,
                departure_dttm,
                builder
            )
            metadata = 'TollRoute'
            potential_routes = traffic_aware_polylines

        except NonTollRouteError as e:
            best_non_toll_route = e.best_route_segments
            potential_routes = e.potential_routes
            metadata = 'NonTollRoute'

        route_state = {
            'connected_graph': connected_graph,
            'intra_route_section_data': intra_route_section_data,
            'inter_route_section_data': inter_route_section_data,
            'total_cost': total_cost,
            'metadata': metadata,
            'best_route_per_budget': {},
            'best_non_toll_route': best_non_toll_route,
            'potential_routes': potential_routes
        }
        route_cache[cache_key] = route_state

    if route_state['metadata'] == 'NonTollRoute':
        best_path = route_state['best_non_toll_route']
    elif route_state['metadata'] == 'TollRoute' and budget in route_state['best_route_per_budget']:
        best_path = route_state['best_route_per_budget'][budget]
    elif route_state['metadata'] == 'TollRoute' and budget not in route_state['best_route_per_budget']:
        (connected_graph, intra_route_section_data, inter_route_section_data) = (
            route_state['connected_graph'],
            route_state['intra_route_section_data'],
            route_state['inter_route_section_data'],
        )
        assert connected_graph is not None and intra_route_section_data is not None and inter_route_section_data is not None
        best_path_plines = compute_best_path(
            connected_graph,
            intra_route_section_data,
            inter_route_section_data,
            budget
        )
        best_path = best_path_plines[0]
        route_state['best_route_per_budget'][budget] = best_path
    else:
        assert False

    assert best_path is not None
    toll_cost = route_state['total_cost']
    toll_cost = toll_cost if toll_cost is not None else 0.0
    response = RouteResponse(
        data=build_feature_collection(best_path, route_state['potential_routes']),
        metadata=route_state['metadata'],
        toll_cost=toll_cost
    )
    
    return response