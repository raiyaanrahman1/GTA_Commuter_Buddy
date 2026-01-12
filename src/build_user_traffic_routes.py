import networkx as nx
from typing import List, Tuple
import osmnx as ox
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv
import os
import flexpolyline as fpl
import asyncio
import aiohttp
from typing import TypedDict

from src.helpers.build_traffic_routing_waypoints import TrafficWaypointsBuilder, StrWaypointsPerRoute

from src.utils.setup_logger import get_logger
logger = get_logger()

load_dotenv()
HERE_API_KEY = os.getenv('HERE_API_KEY')
ROUTING_URL = "https://router.hereapi.com/v8/routes"
id_maps = []

class RouteConnection(TypedDict):
    start_node_id: int
    start_node_route_idx: int
    end_node_id: int
    end_node_route_idx: int

type ConnectingRoutesType = List[RouteConnection]

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
    connecting_routes: ConnectingRoutesType = []
    for toll_node in toll_graph.nodes:
        for i, route_graph in enumerate(route_graphs[1:], start=1):
            toll_node_x, toll_node_y = toll_graph.nodes[toll_node]['x'], toll_graph.nodes[toll_node]['y']
            nearest_node = ox.distance.nearest_nodes(route_graph, X=toll_node_x, Y=toll_node_y, return_dist=False)
            
            nearest_node_x, nearest_node_y = route_graph.nodes[nearest_node]['x'], route_graph.nodes[nearest_node]['y']
            if nearest_node in toll_graph.nodes or toll_node in route_graph.nodes:
                assert nearest_node_x != toll_node_x and nearest_node_y != toll_node_y
                # TODO: solve the conflicting ids issue?

            # assert nearest_node not in toll_graph.nodes and toll_node not in route_graph.nodes # Ensure non-conflicting node ids for when they're merged
            connecting_routes.append({
                'start_node_id': nearest_node,
                'start_node_route_idx': i,
                'end_node_id': toll_node,
                'end_node_route_idx': 0
            })
            connecting_routes.append({
                'start_node_id': toll_node,
                'start_node_route_idx': 0,
                'end_node_id': nearest_node,
                'end_node_route_idx': i
            })
    return connecting_routes

def get_traffic_aware_route(
        origin: str,
        destination: str,
        waypoints: StrWaypointsPerRoute,
        route_idx: int,
        polylines: list # TODO: create polyline type
    ) -> None:
    departure_time = datetime.now(timezone.utc).isoformat()

    url = ROUTING_URL
    params = {
        "transportMode": "car",
        "origin": origin,
        "destination": destination,
        "via": waypoints[route_idx],
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

    logger.info(f'non-traffic duration for route {route_idx + 1}: {total / 60}')
    logger.info('end of route\n')
    # print(len(route['sections']))
    # print(len(r.json()['routes']))

async def get_route(
        session: aiohttp.ClientSession,
        origin_str: str,
        dest_str: str,
        origin_node_id: int,
        origin_route_node: int,
        dest_node_id: int,
        dest_route_node: int
        ):
    departure_time = datetime.now(timezone.utc).isoformat()

    params = {
        "transportMode": "car",
        "origin": origin_str,
        "destination": dest_str,
        "return": "summary,polyline,actions",
        "routingMode": "fast",
        "departureTime": departure_time,
        "apiKey": HERE_API_KEY
    }
    async with session.get(ROUTING_URL, params=params) as response:
        data = await response.json()
        # Extract distance/duration from the first section
        route = data['routes'][0]['sections'][0]
        summary = route['summary']
        polyline = fpl.decode(route['polyline'])
        return (
            origin_node_id,
            origin_route_node,
            dest_node_id,
            dest_route_node,
            summary,
            polyline
        )

async def get_traffic_aware_connecting_routes_helper(
    connecting_routes: ConnectingRoutesType,
    route_graphs: List[nx.MultiDiGraph]
):
    waypoints: List[tuple] = []
    for route_conn in connecting_routes:
        origin_route_idx = route_conn['start_node_route_idx']
        dest_route_idx = route_conn['end_node_route_idx']

        origin_node_id = route_conn['start_node_id']
        dest_node_id = route_conn['end_node_id']

        origin_x = route_graphs[origin_route_idx].nodes[origin_node_id]['x']
        origin_y = route_graphs[origin_route_idx].nodes[origin_node_id]['y']

        dest_x = route_graphs[dest_route_idx].nodes[dest_node_id]['x']
        dest_y = route_graphs[dest_route_idx].nodes[dest_node_id]['y']

        waypoint = (
            f'{origin_y},{origin_x}',
            f'{dest_y},{dest_x}',
            origin_node_id,
            origin_route_idx,
            dest_node_id,
            dest_route_idx
        )
        waypoints.append(waypoint)
    async with aiohttp.ClientSession() as session:
        tasks = [get_route(session, *args) for args in waypoints]
        results = await asyncio.gather(*tasks)
        for res in results:
            logger.debug(res)
        return results
    assert False

def get_traffic_aware_connecting_routes(
        connecting_routes: ConnectingRoutesType,
        route_graphs: List[nx.MultiDiGraph],
        polylines: list # TODO: create polyline type
    ) -> None:
    results = asyncio.run(get_traffic_aware_connecting_routes_helper(connecting_routes, route_graphs))
    polylines += [res[-1] for res in results]


def get_traffic_aware_durations(
        route_graphs: List[nx.MultiDiGraph],
        connections: ConnectingRoutesType,
        origin: tuple[float, float],
        destination: tuple[float, float],
        route_polylines: List[List[Tuple]]
    ):
    waypoints_builder = TrafficWaypointsBuilder()
    waypoints, node_waypoints_maps = waypoints_builder.build_waypoints(route_graphs, route_polylines)
    waypoints_builder.realign_nodes_to_waypoints(route_graphs, node_waypoints_maps)
    
    origin_str = f'{origin[0]},{origin[1]}'
    destination_str = f'{destination[0]},{destination[1]}'

    polylines = []
    for i, _ in enumerate(route_graphs):
        get_traffic_aware_route(origin_str, destination_str, waypoints, i, polylines)
    
    get_traffic_aware_connecting_routes(connections, route_graphs, polylines)
        
    return polylines
    


def build_connected_graph(route_graphs: List[nx.MultiDiGraph], origin, destination):
    connecting_routes = get_connecting_routes(route_graphs)
    full_graph = nx.MultiDiGraph(nx.compose_all(route_graphs))

    for route_connection in connecting_routes:
        full_graph.add_edge(route_connection['start_node_id'], route_connection['end_node_id'])

    return full_graph, connecting_routes

