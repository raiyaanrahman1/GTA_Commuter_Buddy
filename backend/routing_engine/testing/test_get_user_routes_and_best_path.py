from routing_engine.src.get_user_routes_and_best_path import get_user_routes_and_best_path
from test_get_best_paths import visualize_path
from datetime import datetime, timezone

def test_get_user_routes_and_best_path():
    origin = 43.393262, -79.802492  # Appleby Line entrance
    destination = 43.841385, -79.306418  # Kennedy Rd exit
    departure_dttm = datetime(2026, 3, 30, 7, 10)
    budget = 5000.0

    route_polylines, best_path_plines, connected_graph = get_user_routes_and_best_path(origin, destination, departure_dttm, budget)
    visualize_path(best_path_plines, connected_graph, route_polylines[:3], 'user_route_best_path.html')
