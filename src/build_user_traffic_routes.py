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
import json

from src.helpers.build_traffic_routing_waypoints import TrafficWaypointsBuilder, StrWaypointsPerRoute
from src.data_structures.connected_route_graph import ConnectedRouteGraph
from src.types.types import ConnectingRoutesType, IntraRouteSectionData, InterRouteSectionData, PolylineType
from src.helpers.get_and_manipulate_graph import get_subgraph_copy, simplify_toll_graph

from src.utils.setup_logger import get_logger
from src.get_toll_cost import get_toll_cost
logger = get_logger()

load_dotenv()
HERE_API_KEY = os.getenv('HERE_API_KEY')
ROUTING_URL = "https://router.hereapi.com/v8/routes"

def simplify_toll_graph_for_connecting_routes(route_graphs: list[nx.MultiDiGraph]):
    simp_route_graph = [route_graph for route_graph in route_graphs]
    simp_toll_graph = get_subgraph_copy(route_graphs[0], set(route_graphs[0].nodes.keys()))
    simp_toll_graph, _ = simplify_toll_graph(simp_toll_graph)
    for node in simp_toll_graph:
        assert node in route_graphs[0].nodes
    # logger.info((len(simp_toll_graph.nodes), len(route_graphs[0].nodes)))
    simp_route_graph[0] = simp_toll_graph
    return simp_route_graph

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
        polylines: list[PolylineType]
    ):
    departure_time = datetime.now(timezone.utc).isoformat()

    url = ROUTING_URL
    params = {
        "transportMode": "car",
        "origin": origin,
        "destination": destination,
        "via": waypoints[route_idx],
        # "alternatives": 2,
        "return": "summary,polyline,actions,tolls",
        "tolls[transponders]": "all",
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
    result: list[IntraRouteSectionData] = []
    for i, section in enumerate(route['sections']):
        polyline_str = section['polyline']
        polyline_sec = fpl.decode(polyline_str)
        full_polyline += polyline_sec

        logger.debug(json.dumps(section))

        duration = section['summary']['duration']
        # logger.debug(section)
        result.append({
            'section_idx': i,
            'route_idx': route_idx,
            'duration': duration            
        })
        total += duration
        # print(duration / 60)
        # print(section['summary']['length'])
    polylines.append(full_polyline)

    logger.info(f'non-traffic duration for route {route_idx + 1}: {total / 60}')
    logger.info('end of route\n')
    # print(len(route['sections']))
    # print(len(r.json()['routes']))

    # TODO: return polyline instead of modifying it in the function for better transparency
    return result

async def get_route(
        session: aiohttp.ClientSession,
        origin_str: str,
        dest_str: str,
        origin_node_id: int,
        origin_route_idx: int,
        dest_node_id: int,
        dest_route_idx: int
        ) -> InterRouteSectionData:
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
        polyline: PolylineType = fpl.decode(route['polyline']) # type: ignore
        return {
            'origin_node_id': origin_node_id,
            'origin_route_idx': origin_route_idx,
            'dest_node_id': dest_node_id,
            'dest_route_idx': dest_route_idx,
            'summary': summary,
            'polyline': polyline,
        }
    assert False

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
        # for res in results:
        #     logger.debug(res)
        return results
    assert False

def get_traffic_aware_connecting_routes(
        connecting_routes: ConnectingRoutesType,
        route_graphs: List[nx.MultiDiGraph],
        polylines: list[PolylineType]
    ):
    results = asyncio.run(get_traffic_aware_connecting_routes_helper(connecting_routes, route_graphs))
    polylines += [res['polyline'] for res in results]
    return results


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

    polylines: list[PolylineType] = []
    intra_route_section_data: list[IntraRouteSectionData] = []
    for i, _ in enumerate(route_graphs):
        section_data = get_traffic_aware_route(origin_str, destination_str, waypoints, i, polylines)
        intra_route_section_data += section_data

    inter_route_section_data = get_traffic_aware_connecting_routes(connections, route_graphs, polylines)

    return polylines, intra_route_section_data, inter_route_section_data
    
def assign_durations_to_graph(
    connected_graph: ConnectedRouteGraph,
    intra_route_section_data: list[IntraRouteSectionData],
    inter_route_section_data: list[InterRouteSectionData]
):
    for section_data in intra_route_section_data:
        route_idx = section_data['route_idx']
        section_idx = section_data['section_idx']
        start_node_id = connected_graph.route_graph_dfs_node_ids[route_idx][section_idx]
        end_node_id = connected_graph.route_graph_dfs_node_ids[route_idx][section_idx + 1]
        connected_graph.graph.edges[start_node_id, end_node_id, 0]['duration'] = section_data['duration']

    for section_data in inter_route_section_data:
        start_node_id = section_data['origin_node_id']
        start_route_idx = section_data['origin_route_idx']
        end_node_id = section_data['dest_node_id']
        end_route_idx = section_data['dest_route_idx']

        mapped_start_id = connected_graph.id_maps[start_route_idx][start_node_id]
        mapped_end_id = connected_graph.id_maps[end_route_idx][end_node_id]

        connected_graph.graph.edges[mapped_start_id, mapped_end_id, 0]['duration'] = section_data['summary']['duration']

def assign_toll_costs_to_graph(
    connected_graph: ConnectedRouteGraph,
    departure_time: datetime
):
    toll_nodes = connected_graph.route_graph_dfs_node_ids[0][1:-1]
    start_node = toll_nodes[0]
    end_node = toll_nodes[-1]

    start_node_data = connected_graph.graph.nodes[start_node]
    end_node_data = connected_graph.graph.nodes[end_node]
    
    start_interchange = start_node_data['interchange_name']
    end_interchange = end_node_data['interchange_name']

    direction = 'east' if start_node_data['x'] < end_node_data['x'] else 'west'

    # TODO: Change get_toll_cost() to take in duration per interchange
    duration = sum(
        float(connected_graph.graph[toll_nodes[i]][toll_nodes[i + 1]][0]['duration']) # type: ignore
        for i in range(0, len(toll_nodes) - 1)
    )

    total_cost, cost_per_interchange = get_toll_cost(
        'light',
        departure_time,
        direction,
        start_interchange,
        end_interchange,
        duration
    )
    logger.debug(f'{total_cost=} {cost_per_interchange=}')

    i = 0
    j = i
    while i < len(toll_nodes) - 1:
        assert j < len(cost_per_interchange)
        node_id = toll_nodes[i]
        portion_start_interchange = cost_per_interchange[j]['portion_start_interchange']
        portion_end_interchange = cost_per_interchange[j]['portion_end_interchange']

        graph_start_interchange = connected_graph.graph.nodes[node_id]['interchange_name']
        graph_end_interchange = connected_graph.graph.nodes[toll_nodes[i + 1]]['interchange_name']

        cost = cost_per_interchange[i]['cost_in_portion']
        if portion_start_interchange == graph_start_interchange and portion_end_interchange != graph_end_interchange:
            cost = 0.0
            while True:
                assert j < len(cost_per_interchange), (graph_start_interchange, graph_end_interchange)
                portion_end_interchange = cost_per_interchange[j]['portion_end_interchange']
                cost += cost_per_interchange[j]['cost_in_portion']
                
                if portion_end_interchange == graph_end_interchange:
                    break
                else:
                    j += 1

        dt = (portion_start_interchange, graph_start_interchange, portion_end_interchange, graph_end_interchange)
        
        assert portion_start_interchange == graph_start_interchange, dt
        assert portion_end_interchange == graph_end_interchange, (
            dt,
            node_id,
            toll_nodes[i + 1],
            connected_graph.graph.nodes[node_id],
            connected_graph.graph.nodes[toll_nodes[i + 1]]
        )

        connected_graph.graph[node_id][toll_nodes[i + 1]][0]['toll_cost'] = cost # type: ignore
        i += 1
        j += 1