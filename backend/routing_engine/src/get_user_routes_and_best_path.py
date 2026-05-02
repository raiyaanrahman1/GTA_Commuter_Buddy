from routing_engine.src.build_user_route_graph import RouteGraphBuilder
from datetime import datetime, timezone
from routing_engine.src.build_user_traffic_routes import (
    get_traffic_aware_durations,
    assign_durations_to_graph,
    get_connecting_routes,
    assign_toll_costs_to_graph,
    simplify_toll_graph_for_connecting_routes
)
from routing_engine.src.data_structures.connected_route_graph import ConnectedRouteGraph
from routing_engine.src.get_best_paths import get_best_paths
from routing_engine.src.helpers.get_best_path_polylines import get_best_path_polylines

from routing_engine.src.utils.setup_logger import get_logger

logger = get_logger()

def get_user_routes_and_best_path(
    origin: tuple[float, float],
    destination: tuple[float, float],
    departure_dttm: datetime,
    budget: float
):
    builder = RouteGraphBuilder()

    departure_dttm_str = departure_dttm.isoformat()
    route_graphs, route_polylines = builder.get_full_route_graph(origin[0], origin[1], destination[0], destination[1], departure_dttm_str)
    
    simp_route_graph = simplify_toll_graph_for_connecting_routes(route_graphs)
    connecting_routes = get_connecting_routes(simp_route_graph)
    traffic_aware_polylines, intra_route_section_data, inter_route_section_data = get_traffic_aware_durations(route_graphs, connecting_routes, origin, destination, route_polylines, departure_dttm_str)
    connected_graph = ConnectedRouteGraph(route_graphs, origin, destination, connecting_routes)
    assign_durations_to_graph(connected_graph, intra_route_section_data, inter_route_section_data)
    total_cost = assign_toll_costs_to_graph(connected_graph, departure_dttm)
    logger.info(f'{total_cost=}')

    paths = get_best_paths(connected_graph, budget)
    best_path_plines = get_best_path_polylines(paths, intra_route_section_data, inter_route_section_data, connected_graph)
    return traffic_aware_polylines, best_path_plines[0], connected_graph

      

