import networkx as nx
from typing import List, Tuple
import osmnx as ox
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv
import os
import flexpolyline as fpl
import json
from timer import Timer
import shapely
from shapely.geometry import LineString, Point
from shapely.ops import nearest_points

load_dotenv()
HERE_API_KEY = os.getenv('HERE_API_KEY')
id_maps = []

with Timer('Getting intersection simplification mapping', 'Got intersection simplification mapping'):
    with open('intersection_simplification_mapping.json', 'r', encoding='utf-8') as f:
        int_simp_mapping = json.load(f)
        int_simp_mapping = {int(key): value for key, value in int_simp_mapping.items()}

with Timer('Loading graphs', 'Loaded graphs'):
    major_ints_graph = ox.load_graphml('major_intersections.graphml')

def get_closest_point_on_polyline(G: nx.MultiDiGraph, node_id: int, polyline_coords: List[Tuple[float, float]]):
    """
    Finds the closest point on a polyline to a graph node.
    Assumes input polyline_coords are in (Lat, Lon) format (e.g. HERE API).
    """
    # 1. Create Lat/Lon Geometries
    node = G.nodes[node_id]
    
    # Node is already x=Lon, y=Lat
    node_point = Point(node['x'], node['y']) 
    
    # FIX: Swap input [(Lat, Lon), ...] to [(Lon, Lat), ...] for Shapely
    polyline_lon_lat = [(lon, lat) for lat, lon in polyline_coords]
    line_geom = LineString(polyline_lon_lat)
    
    # 2. Project both to UTM (Meters)
    # ox.projection automatically picks the correct local UTM zone (e.g. Zone 17T for Toronto)
    point_proj, crs = ox.projection.project_geometry(node_point)
    line_proj, _    = ox.projection.project_geometry(line_geom, to_crs=crs)
    
    # 3. Find the closest point in projected space (Meters)
    # nearest_points returns tuple (closest_on_geom1, closest_on_geom2)
    closest_point_proj = nearest_points(line_proj, point_proj)[0]
    
    # 4. Calculate exact distance in meters
    # We use shapely.distance(a, b) to avoid IDE type-check errors on the .distance() method
    dist_meters = shapely.distance(point_proj, closest_point_proj)
    
    # 5. Project the closest point back to Lat/Lon
    closest_point_latlon, _ = ox.projection.project_geometry(
        closest_point_proj, 
        crs=crs, 
        to_latlong=True
    )
    
    # Return format: Lon (x), Lat (y), Distance (m)
    return closest_point_latlon.x, closest_point_latlon.y, dist_meters # type: ignore

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

def get_closest_original_node_to_polyline(route_graph: nx.MultiDiGraph, node_id: int, polyline: List[Tuple], route_graph_idx, route_node_mappings):
    # Loop through simp_to_nonsimp_map[node_id]
    distances = []
    assert node_id in route_node_mappings[route_graph_idx], route_graph_idx
    node_oxid = route_node_mappings[route_graph_idx][node_id]

    # TODO: print in debug mode only
    print(f'start for {node_oxid}\n')
    for original_node_id in int_simp_mapping[node_oxid]:
        new_x, new_y = route_graph.nodes[node_id]['x'], route_graph.nodes[node_id]['y']
        old_x, old_y = major_ints_graph.nodes[original_node_id]['x'], major_ints_graph.nodes[original_node_id]['y']
        
        print(node_oxid, new_x, new_y)
        print(original_node_id, old_x, old_y)
        print(ox.distance.great_circle(new_y, new_x, old_y, old_x))
        print()

        closest_x, closest_y, dist = get_closest_point_on_polyline(major_ints_graph, original_node_id, polyline)
        distances.append((closest_x, closest_y, dist, major_ints_graph.nodes[original_node_id]['x'], major_ints_graph.nodes[original_node_id]['y']))

    return min(distances, key=lambda dist: dist[2])

def get_traffic_aware_durations(route_graphs: List[nx.MultiDiGraph], connections, origin, destination, route_polylines: List[List[Tuple]]):
    with Timer('Getting Route Node Mapping', 'Getting Route Node Mapping'):
        with open('route_node_mappings.json', 'r', encoding='utf-8') as f:
            route_node_mappings = json.load(f)

    route_node_mappings = [{int(p_id): ox_id for p_id, ox_id in route_map.items()} for route_map in route_node_mappings]

    
    origin = f'{origin[0]},{origin[1]}'
    destination = f'{destination[0]},{destination[1]}'
    polylines = []

    # TODO: print in debug mode only
    print(f'*************{len(route_graphs)}')
    print(f'*************{len(route_polylines)}')
    for i, route_graph in enumerate(route_graphs):
        start_nodes = [node for node in route_graph.nodes if route_graph.in_degree(node) == 0]
        assert len(start_nodes) == 1
        start_node = start_nodes[0]
        dfs_nodes = nx.dfs_preorder_nodes(route_graph, start_node)
        waypoints = []
        for node in dfs_nodes:
            if i == 0: # toll graph
                # TODO: the inaccurate waypoints still occurs in this scenario
                # due to the graph simplification. Fix?
                waypoints.append(f'{route_graph.nodes[node]['y']},{route_graph.nodes[node]['x']}')
            else:
                # new_ids = list(id_maps[i].values())
                # assert len(new_ids) == len(set(new_ids))
                # reversed_id_map = {value: key for key, value in id_maps[i].items()}
                # og_node_id = reversed_id_map[node]

                closest_x, closest_y, dist, node_x, node_y = get_closest_original_node_to_polyline(route_graph, node, route_polylines[i], i, route_node_mappings)
                
                print(f'results for node {node}, route_idx {i}')
                print(route_graph.nodes[node]['x'], route_graph.nodes[node]['y'])
                print(node_x, node_y)
                print(closest_x, closest_y, dist)
                print()
                waypoints.append(f'{closest_y},{closest_x}')


        departure_time = datetime.now(timezone.utc).isoformat()

        url = "https://router.hereapi.com/v8/routes"
        params = {
            "transportMode": "car",
            "origin": origin,
            "destination": destination,
            "via": waypoints,
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
        for i, section in enumerate(route['sections']):
            polyline_str = section['polyline']
            polyline_sec = fpl.decode(polyline_str)
            full_polyline += polyline_sec

            total += section['summary']['duration']
            # print(section['summary']['duration'] / 60)
            # print(section['summary']['length'])
        polylines.append(full_polyline)

        print(total / 60)
        print('end of route\n')
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

