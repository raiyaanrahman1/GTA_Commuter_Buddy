from models.route_models import RouteRequest, RouteResponse, FeatureCollection
from misc.sliding_ttl_cache import SlidingTTLCache
from misc.types import RouteState, RouteData

from routing_engine.src.get_user_routes_and_best_path import build_route_graph, compute_best_path
from routing_engine.src.errors.errors import NonTollRouteError
from routing_engine.src.types.types import PolylineType
from routing_engine.src.build_user_route_graph import RouteGraphBuilder


def to_geojson_feature(route_data: RouteData, route_idx: int):
    # Swap [lat, lng] to [lng, lat] for Mapbox/GeoJSON
    swapped_coords = [[lng, lat] for lat, lng in route_data['polyline']]
    return {
        "type": "Feature",
        "properties": {
            "route_type": route_data['type'], 
            "route_idx": route_idx,
            "duration": route_data['duration'],
            "cost": route_data['cost']
        },
        "geometry": {
            "type": "LineString",
            "coordinates": swapped_coords
        }
    }

def build_feature_collection(best_path: RouteData, potential_routes: list[RouteData]):
    features = []
    
    # Add potential routes
    for i, route in enumerate(potential_routes):
        features.append(to_geojson_feature(route, i))

    features.append(to_geojson_feature(best_path, 0))

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
        best_non_toll_route: RouteData | None = None
        potential_routes: list[RouteData] = []
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

            i = 0
            route_idx = 0
            route_duration = 0
            route_pline: PolylineType = []

            for _, data in enumerate(intra_route_section_data):
                if data['route_idx'] > route_idx:
                    potential_routes.append(
                        RouteData(
                            polyline=route_pline,
                            duration=route_duration,
                            cost=0.0,
                            type='potential'
                        )
                    )
                    route_duration = 0
                    route_pline = []
                    route_idx = data['route_idx']
                
                route_duration += data['duration']
                route_pline += data['section_polyline']

            potential_routes.append(
                RouteData(
                    polyline=route_pline,
                    duration=route_duration,
                    cost=0.0,
                    type='potential'
                )
            )
            
            potential_routes[0]['cost'] = total_cost

            potential_routes += [
                RouteData(
                    polyline=data['polyline'],
                    duration=data['summary']['duration'],
                    cost=0.0 if i > 0 else total_cost,
                    type='connection'
                )
                for i, data in enumerate(inter_route_section_data)
            ]

            assert len(potential_routes) == len(traffic_aware_polylines), (len(potential_routes), len(traffic_aware_polylines))
            assert [data['polyline'] for data in potential_routes] == traffic_aware_polylines


        except NonTollRouteError as e:
            potential_routes = [
                {
                    'polyline': e.potential_routes[i],
                    'duration': e.durations[i],
                    'cost': 0.0,
                    'type': 'potential'
                }
                for i in range(len(e.potential_routes))
            ]
            best_non_toll_route = {
                'polyline': potential_routes[e.best_route_idx]['polyline'],
                'duration': potential_routes[e.best_route_idx]['duration'],
                'cost': potential_routes[e.best_route_idx]['cost'],
                'type': 'best'
            }
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
        assert route_state['best_non_toll_route'] is not None
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
        candidate_plines, time_and_money_costs = compute_best_path(
            connected_graph,
            intra_route_section_data,
            inter_route_section_data,
            budget
        )
        best_path_pline_segs = candidate_plines[0]
        best_path_pline: PolylineType = []
        for seg in best_path_pline_segs:
            best_path_pline += seg
        
        best_path_duration, best_path_cost = time_and_money_costs[0]
        best_path: RouteData = {
            'polyline': best_path_pline,
            'duration': best_path_duration,
            'cost': best_path_cost,
            'type': 'best'
        }
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