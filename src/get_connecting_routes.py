import networkx as nx
from typing import List, Tuple
import osmnx as ox
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv
import os
import flexpolyline as fpl

from src.build_traffic_routing_waypoints import TrafficWaypointsBuilder

from src.utils.setup_logger import get_logger
logger = get_logger()

load_dotenv()
HERE_API_KEY = os.getenv('HERE_API_KEY')
id_maps = []

def relabel_nodes_in_dfs_order(route_graphs: List[nx.MultiDiGraph]):
    for i, route_graph in enumerate(route_graphs):
        start_nodes = [node for node in route_graph.nodes if route_graph.in_degree(node) == 0]
        assert len(start_nodes) == 1
        start_node = start_nodes[0]
        dfs_nodes = nx.dfs_preorder_nodes(route_graph, start_node)
        new_id_mapping = {old_node_id: (i * 10**6) + j for j, old_node_id in enumerate(dfs_nodes)}
        id_maps.append(new_id_mapping)
        route_graph.graph['my_id'] = f'G{i}'
        nx.relabel_nodes(route_graph, new_id_mapping, copy=False)

def get_connecting_routes(route_graphs: List[nx.MultiDiGraph]):
    # relabel_nodes_in_dfs_order(route_graphs)
    toll_graph = route_graphs[0]
    connecting_routes = []
    for toll_node in toll_graph.nodes:
        for route_graph in route_graphs[1:]:
            toll_node_x, toll_node_y = toll_graph.nodes[toll_node]['x'], toll_graph.nodes[toll_node]['y']
            nearest_node = ox.distance.nearest_nodes(route_graph, X=toll_node_x, Y=toll_node_y, return_dist=False)
            
            nearest_node_x, nearest_node_y = route_graph.nodes[nearest_node]['x'], route_graph.nodes[nearest_node]['y']
            if nearest_node in toll_graph.nodes or toll_node in route_graph.nodes:
                assert nearest_node_x != toll_node_x and nearest_node_y != toll_node_y
                # TODO: solve the conflicting ids issue?

            # assert nearest_node not in toll_graph.nodes and toll_node not in route_graph.nodes # Ensure non-conflicting node ids for when they're merged
            connecting_routes.append((nearest_node, toll_node))
            connecting_routes.append((toll_node, nearest_node))
    return connecting_routes


def get_traffic_aware_durations(route_graphs: List[nx.MultiDiGraph], connections, origin, destination, route_polylines: List[List[Tuple]]):
    waypoints_builder = TrafficWaypointsBuilder()
    waypoints = waypoints_builder.build_waypoints(route_graphs, route_polylines)
    
    origin = f'{origin[0]},{origin[1]}'
    destination = f'{destination[0]},{destination[1]}'

    polylines = []
    for i, route_graph in enumerate(route_graphs):    
        departure_time = datetime.now(timezone.utc).isoformat()

        url = "https://router.hereapi.com/v8/routes"
        params = {
            "transportMode": "car",
            "origin": origin,
            "destination": destination,
            "via": waypoints[i],
            # "alternatives": 2,
            "return": "summary,polyline,actions",
            "routingMode": "fast",
            "departureTime": departure_time,
            "apiKey": HERE_API_KEY
        }
        r = requests.get(url, params=params)
        # print(r.text)
        r.raise_for_status()
        route = r.json()['routes'][0]
        total = 0
        full_polyline = []
        for _, section in enumerate(route['sections']):
            polyline_str = section['polyline']
            polyline_sec = fpl.decode(polyline_str)
            full_polyline += polyline_sec

            total += section['summary']['duration']
            # print(section['summary']['duration'] / 60)
            # print(section['summary']['length'])
        polylines.append(full_polyline)

        logger.info(f'non-traffic duration for route {i + 1}: {total / 60}')
        logger.info('end of route\n')
        # print(len(route['sections']))
        # print(len(r.json()['routes']))

        connections_from_route = [(u, v) for (u, v) in connections if u in route_graph.nodes]
        
    return polylines
    


def build_connected_graph(route_graphs: List[nx.MultiDiGraph], origin, destination):
    connecting_routes = get_connecting_routes(route_graphs)
    full_graph = nx.MultiDiGraph(nx.compose_all(route_graphs))

    for u, v in connecting_routes:
        full_graph.add_edge(u, v)

    return full_graph, connecting_routes

