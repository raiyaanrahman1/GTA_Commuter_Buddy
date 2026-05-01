import folium
import seaborn as sns
import json

from testing.test_get_connecting_routes import test_connecting_routes

from src.get_best_paths import get_best_paths
from src.types.types import PolylineType
from src.data_structures.connected_route_graph import ConnectedRouteGraph
from src.utils.visualize_graph import setup_folium_graph
from src.utils.get_directories import TEST_OUTPUTS_FOLDER
from src.utils.setup_logger import get_logger
from src.helpers.get_best_path_polylines import get_best_path_polylines

logger = get_logger()


def create_base_map(connected_graph: ConnectedRouteGraph, route_polylines: list[PolylineType]):
    m = setup_folium_graph(connected_graph.graph)
    colours = sns.color_palette("hls", 3).as_hex()

    for i, polyline in enumerate(route_polylines):
        folium.PolyLine(polyline, color=colours[i], weight=3, opacity=0.8,tooltip=i).add_to(m)

    return m

def visualize_path(
    path_plines: list[PolylineType],
    connected_graph: ConnectedRouteGraph,
    route_polylines: list[PolylineType],
    file_name: str
):
    m = create_base_map(connected_graph, route_polylines)
    for section_polyline in path_plines:
        folium.PolyLine(section_polyline, color='black', weight=2, opacity=0.8).add_to(m)
    m.save(TEST_OUTPUTS_FOLDER / file_name)
    
def visualize_paths(
    best_path_plines: list[list[PolylineType]],
    connected_graph: ConnectedRouteGraph,
    route_polylines: list[PolylineType]
):
    for path_idx, path_plines in enumerate(best_path_plines):
        visualize_path(path_plines, connected_graph, route_polylines, f'best_path_{path_idx + 1}.html')

def test_get_best_paths():
    connected_graph, intra_route_data, inter_route_data, route_polylines, total_toll_cost = test_connecting_routes()
    
    budget = 8000.0
    paths = get_best_paths(connected_graph, budget)
    logger.info(f'{total_toll_cost=}')
    logger.info(json.dumps(paths[0]))
    
    budget = 5000.0
    paths = get_best_paths(connected_graph, budget)
    logger.info(f'{total_toll_cost=}')
    logger.info(json.dumps(paths[0]))
    best_path_plines = get_best_path_polylines(paths, intra_route_data, inter_route_data, connected_graph)
    visualize_paths(best_path_plines, connected_graph, route_polylines)
