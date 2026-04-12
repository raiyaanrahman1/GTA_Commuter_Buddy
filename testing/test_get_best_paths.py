import folium
import seaborn as sns
import json

from testing.test_get_connecting_routes import test_connecting_routes

from src.get_best_paths import get_best_paths
from src.types.types import IntraRouteSectionData, InterRouteSectionData, PolylineType
from src.data_structures.connected_route_graph import ConnectedRouteGraph
from src.utils.visualize_graph import setup_folium_graph, visualize_graph
from src.utils.get_directories import TEST_OUTPUTS_FOLDER
from src.utils.setup_logger import get_logger

logger = get_logger()

type PathType = list[tuple[list[int], int, float]]

def map_route_polylines(
        intra_route_data: list[IntraRouteSectionData],
        inter_route_data: list[InterRouteSectionData],
        connected_graph: ConnectedRouteGraph
    ):
    intra_route_polylines: dict[int, dict[int, PolylineType]] = {}
    inter_route_polylines: dict[int, dict[int, PolylineType]] = {}
    for i, section_data in enumerate(intra_route_data):
        route_idx = section_data['route_idx']
        section_idx = section_data['section_idx']
        start_node_id = connected_graph.route_graph_dfs_node_ids[route_idx][section_idx]
        end_node_id = connected_graph.route_graph_dfs_node_ids[route_idx][section_idx + 1]

        if start_node_id not in intra_route_polylines:
            intra_route_polylines[start_node_id] = {}
        intra_route_polylines[start_node_id][end_node_id] = section_data['section_polyline']
    
    for i, section_data in enumerate(inter_route_data):
        start_route_idx = section_data['origin_route_idx']
        start_node_id = section_data['origin_node_id']
        end_route_idx = section_data['dest_route_idx']
        end_node_id = section_data['dest_node_id']

        start_node_id = connected_graph.id_maps[start_route_idx][start_node_id]
        end_node_id = connected_graph.id_maps[end_route_idx][end_node_id]
        
        if start_node_id not in inter_route_polylines:
            inter_route_polylines[start_node_id] = {}
        inter_route_polylines[start_node_id][end_node_id] = section_data['polyline']

    return intra_route_polylines, inter_route_polylines

def create_base_map(connected_graph: ConnectedRouteGraph, route_polylines: list[PolylineType]):
    m = setup_folium_graph(connected_graph.graph)
    colours = sns.color_palette("hls", 3).as_hex()

    for i, polyline in enumerate(route_polylines):
        folium.PolyLine(polyline, color=colours[i], weight=3, opacity=0.8,tooltip=i).add_to(m)

    return m

def visualize_paths(
        paths: PathType,
        intra_route_data: list[IntraRouteSectionData],
        inter_route_data: list[InterRouteSectionData],
        connected_graph: ConnectedRouteGraph,
        route_polylines: list[PolylineType]
    ):
    intra_route_polylines, inter_route_polylines = map_route_polylines(intra_route_data, inter_route_data, connected_graph)

    for path_idx, (path, time_cost, money_cost) in enumerate(paths):
        m = create_base_map(connected_graph, route_polylines)
        for i, node_id in enumerate(path[:-1]):
            section_polyline = None
            end_node = path[i + 1]
            if node_id in intra_route_polylines and end_node in intra_route_polylines[node_id]:
                section_polyline = intra_route_polylines[node_id][end_node]
            elif node_id in inter_route_polylines and end_node in inter_route_polylines[node_id]:
                section_polyline = inter_route_polylines[node_id][end_node]
            else:
                raise ValueError(f'Could not find corresponding polyline for node {node_id} to {end_node}')

            folium.PolyLine(section_polyline, color='black', weight=2, opacity=0.8).add_to(m)
        m.save(TEST_OUTPUTS_FOLDER / f'best_path_{path_idx + 1}.html')



def test_get_best_paths():
    connected_graph, intra_route_data, inter_route_data, route_polylines, total_toll_cost = test_connecting_routes()
    
    budget = 6000.0
    paths = get_best_paths(connected_graph, budget)
    logger.info(f'{total_toll_cost=}')
    logger.info(json.dumps(paths[0]))
    
    budget = 3000.0
    paths = get_best_paths(connected_graph, budget)
    logger.info(f'{total_toll_cost=}')
    logger.info(json.dumps(paths[0]))
    visualize_paths(paths, intra_route_data, inter_route_data, connected_graph, route_polylines)
