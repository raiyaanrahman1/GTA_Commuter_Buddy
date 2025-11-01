from dotenv import load_dotenv
import os
from timer import Timer
import osmnx as ox
import networkx as nx
import requests
from typing import List, Tuple, Dict, Set
import flexpolyline as fpl
import numpy as np

from get_and_manipulate_graph import get_subgraph_copy, simplify_node_chain
from constants import GRAPH_TO_PLINE_MAPPING_DIST

class RouteGraphBuilder:
    def __init__(self) -> None:
        load_dotenv()
        self.here_api_key = os.getenv('HERE_API_KEY')

        with Timer('Loading graphs', 'Loaded graphs'):
            self.full_toll_graph = ox.load_graphml('full_toll_graph.graphml')
            self.toll_graph = ox.load_graphml('simplified_toll_graph.graphml')
            self.major_ints_graph = ox.load_graphml('major_intersections_simplified.graphml')

        self.combined_graph = nx.MultiDiGraph(nx.compose(self.major_ints_graph, self.toll_graph))
        assert isinstance(self.combined_graph, nx.MultiDiGraph)
        toll_graph_sw_to_ne, toll_graph_ne_to_sw = self.get_graph_directional_components(self.toll_graph)
        self.toll_graph_sw_to_ne, self.toll_graph_ne_to_sw = (
            get_subgraph_copy(self.toll_graph, toll_graph_sw_to_ne),
            get_subgraph_copy(self.toll_graph, toll_graph_ne_to_sw)
        )


    def get_full_route_graph(
        self,
        start_lat: float,
        start_lon: float,
        end_lat: float,
        end_lon: float
    ):
        # Step 1: fetch routes:
        origin = f'{start_lat},{start_lon}'
        destination = f'{end_lat},{end_lon}'

        url = "https://router.hereapi.com/v8/routes"
        params = {
            "transportMode": "car",
            "origin": origin,
            "destination": destination,
            # "alternatives": 2,
            "return": "polyline,tolls,summary,actions",
            "apiKey": self.here_api_key
        }
        r = requests.get(url, params=params)
        r.raise_for_status()
        toll_routes = r.json()['routes']
        assert len(toll_routes) == 1

        params['alternatives'] = 1
        params['avoid[features]'] = 'tollRoad'
        r = requests.get(url, params=params)
        r.raise_for_status()
        routes = r.json()['routes']

        print(f'Found {len(routes)} routes')
        route_graphs: List[nx.MultiDiGraph] = []
        polylines: List[List[Tuple]] = []

        for i, route in enumerate(toll_routes):
            polyline_str = route['sections'][0]['polyline']
            decoded = fpl.decode(polyline_str)  # returns list of (lat, lon[, z])
            latlon = [(lat, lon) for lat, lon, *_ in decoded]
            polylines.append(latlon)

            self.toll_graph = self.choose_directional_graph_from_polyline(latlon, self.toll_graph_sw_to_ne, self.toll_graph_ne_to_sw)
            toll_nodes = self.get_route_nodes(latlon, self.toll_graph, GRAPH_TO_PLINE_MAPPING_DIST)
            # route_nodes = self.get_route_nodes(latlon, self.major_ints_graph, 50)
            route_nodes = {} # Excluding non-toll nodes for now because some are too close to toll nodes
            route_graph = self.build_route_graph(route_nodes | toll_nodes, self.combined_graph)

            route_graphs.append(route_graph)

        p2b_mappings = []
        for i, route in enumerate(routes):
            polyline_str = route['sections'][0]['polyline']
            decoded = fpl.decode(polyline_str)  # returns list of (lat, lon[, z])
            latlon = [(lat, lon) for lat, lon, *_ in decoded]
            polylines.append(latlon)

            route_nodes = self.get_route_nodes(latlon, self.major_ints_graph, GRAPH_TO_PLINE_MAPPING_DIST)
            print(f'mapped {len(route_nodes)} nodes')
            p2b_mappings.append(route_nodes)

            in_order_node_ids = [item[1] for item in sorted(route_nodes.items(), key=lambda item: item[0])]
            nodes_to_keep, _ = simplify_node_chain(in_order_node_ids, self.major_ints_graph)
            nodes_to_keep_set = set(nodes_to_keep)
            nodes_to_keep = {item[0]: item[1] for item in route_nodes.items() if item[1] in nodes_to_keep_set}
            print(f'simplified chain to {len(nodes_to_keep)} nodes')

            route_graph = self.build_route_graph(nodes_to_keep, self.major_ints_graph)
            route_graphs.append(route_graph)

        for i, route_graph in enumerate(route_graphs):
            print(f'Graph {i + 1}: {len(route_graphs[i].nodes)}')
            
        return route_graphs, polylines

    def get_route_nodes(self, polyline_coords: List[Tuple], base_graph: nx.MultiDiGraph, max_dist):

        # Extract coordinate arrays
        lats, lons = zip(*polyline_coords)
        # Find nearest nodes and distances (vectorized)
        nearest_nodes, distances = ox.distance.nearest_nodes(
            base_graph, lons, lats, return_dist=True
        )
        # Make sure there is only one closest node id per point
        for nearest_node in nearest_nodes:
            if not isinstance(nearest_node, np.integer):
                assert False, f'{nearest_node} {type(nearest_node)}'
        assert len(nearest_nodes) == len(polyline_coords)
        assert len(distances) == len(polyline_coords)

        node_to_nearest_point = {}
        for point_idx, (node_id, dist) in enumerate(zip(nearest_nodes, distances)):
            if node_id not in node_to_nearest_point:
                node_to_nearest_point[node_id] = (point_idx, dist)
                continue
            if dist < node_to_nearest_point[node_id][1]:
                node_to_nearest_point[node_id] = (point_idx, dist)

        # Accumulate best (min-distance) mapping per node
        best_map: Dict[int, Tuple[np.float64, int]] = {}
        for point_idx, (node_id, dist) in enumerate(zip(nearest_nodes, distances)):
            if dist <= max_dist:
                node_id = int(node_id)
                assert isinstance(dist, np.float64)
                prev = best_map.get(node_id)
                if prev is None or dist < prev[0]:
                    best_map[node_id] = (dist, point_idx)

        # Sort selected nodes by their order along the polyline
        selected = sorted(best_map.items(), key=lambda item: item[1][1])
        if not selected:
            assert False # No valid points found
        
        return {item[1]: node_id for node_id, item in selected}

    def build_route_graph(self, route_nodes: Dict[int, int], graph: nx.MultiDiGraph):
        G_sub = nx.MultiDiGraph()
        G_sub.graph.update(graph.graph)

        prev_node = None
        for pline_idx in sorted(route_nodes.keys()):
            node_id = route_nodes[pline_idx]
            # Copy node attributes from the base graph
            G_sub.add_node(pline_idx, **graph.nodes[node_id])
            if prev_node is not None:
                # Add directed edge
                G_sub.add_edge(
                    prev_node,
                    pline_idx,
                    length=ox.distance.great_circle(
                        graph.nodes[route_nodes[prev_node]]['y'],
                        graph.nodes[route_nodes[prev_node]]['x'],
                        graph.nodes[node_id]['y'],
                        graph.nodes[node_id]['x']
                    ))
            prev_node = pline_idx
        
        return G_sub

    def get_graph_directional_components(self, graph: nx.MultiDiGraph):
        components = nx.weakly_connected_components(graph)
        sw_to_ne_comp, ne_to_sw_comp = None, None
        for component in components:
            starting_nodes = [
                node for node in component
                if graph.in_degree(node) == 0 and graph.out_degree(node) == 1
            ]
            assert len(starting_nodes) == 1, len(starting_nodes)
            ending_nodes = [
                node for node in component
                if graph.in_degree(node) == 1 and graph.out_degree(node) == 0
            ]
            assert len(ending_nodes) == 1

            start_node, end_node = starting_nodes[0], ending_nodes[0]
            if graph.nodes[start_node]['y'] < graph.nodes[end_node]['y'] and graph.nodes[start_node]['x'] < graph.nodes[end_node]['x']:
                sw_to_ne_comp = component
            elif graph.nodes[start_node]['y'] > graph.nodes[end_node]['y'] and graph.nodes[start_node]['x'] > graph.nodes[end_node]['x']:
                ne_to_sw_comp = component
            else:
                assert False

        assert sw_to_ne_comp is not None and ne_to_sw_comp is not None

        return sw_to_ne_comp, ne_to_sw_comp    
    
    def choose_directional_graph_from_polyline(
            self,
            polyline: List[Tuple],
            sw_to_ne_graph: nx.MultiDiGraph,
            ne_to_sw_graph: nx.MultiDiGraph
        ):
        (lat1, lon1), (lat2, lon2) = polyline[0], polyline[-1]
        if (lat2 > lat1 and lon2 > lon1):
            return sw_to_ne_graph
        elif (lat2 < lat1 and lon2 < lon1):
            return ne_to_sw_graph
        assert False
    