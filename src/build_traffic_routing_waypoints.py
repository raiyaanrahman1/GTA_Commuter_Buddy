import networkx as nx
from typing import List, Tuple
import osmnx as ox
import json
import shapely
from shapely.geometry import LineString, Point
from shapely.ops import nearest_points

from src.utils.timer import Timer
from src.utils.get_directories import INTERMEDIATE_RESULTS_DIR
from src.utils.setup_logger import get_logger
logger = get_logger()


class TrafficWaypointsBuilder:
    def __init__(self) -> None:
        with Timer('Getting intersection simplification mapping', 'Got intersection simplification mapping'):
            with open(INTERMEDIATE_RESULTS_DIR / 'intersection_simplification_mapping.json', 'r', encoding='utf-8') as f:
                int_simp_mapping = json.load(f)
                self.int_simp_mapping = {int(key): value for key, value in int_simp_mapping.items()}

        with Timer('Loading graphs', 'Loaded graphs'):
            self.major_ints_graph = ox.load_graphml(INTERMEDIATE_RESULTS_DIR / 'major_intersections.graphml')

    def get_closest_point_on_polyline(self, G: nx.MultiDiGraph, node_id: int, polyline_coords: List[Tuple[float, float]]):
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
    
    def get_closest_original_node_to_polyline(self, route_graph: nx.MultiDiGraph, node_id: int, polyline: List[Tuple], route_graph_idx, route_node_mappings):
        # Loop through simp_to_nonsimp_map[node_id]
        distances = []
        assert node_id in route_node_mappings[route_graph_idx], route_graph_idx
        node_oxid = route_node_mappings[route_graph_idx][node_id]

        logger.debug(f'start for {node_oxid}\n')
        for original_node_id in self.int_simp_mapping[node_oxid]:
            new_x, new_y = route_graph.nodes[node_id]['x'], route_graph.nodes[node_id]['y']
            old_x, old_y = self.major_ints_graph.nodes[original_node_id]['x'], self.major_ints_graph.nodes[original_node_id]['y']
            
            logger.debug((node_oxid, new_x, new_y))
            logger.debug((original_node_id, old_x, old_y))
            logger.debug(ox.distance.great_circle(new_y, new_x, old_y, old_x))
            logger.debug('')

            closest_x, closest_y, dist = self.get_closest_point_on_polyline(self.major_ints_graph, original_node_id, polyline)
            distances.append((closest_x, closest_y, dist, self.major_ints_graph.nodes[original_node_id]['x'], self.major_ints_graph.nodes[original_node_id]['y']))

        return min(distances, key=lambda dist: dist[2])
    
    def build_waypoints(self, route_graphs: List[nx.MultiDiGraph], route_polylines: List[List[Tuple]]):
        with Timer('Getting Route Node Mapping', 'Getting Route Node Mapping'):
            with open(INTERMEDIATE_RESULTS_DIR / 'route_node_mappings.json', 'r', encoding='utf-8') as f:
                route_node_mappings = json.load(f)

        route_node_mappings = [{int(p_id): ox_id for p_id, ox_id in route_map.items()} for route_map in route_node_mappings]

        logger.debug(f'*************{len(route_graphs)}')
        logger.debug(f'*************{len(route_polylines)}')
        all_waypoints = []
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

                    closest_x, closest_y, dist, node_x, node_y = self.get_closest_original_node_to_polyline(route_graph, node, route_polylines[i], i, route_node_mappings)
                    
                    logger.debug(f'results for node {node}, route_idx {i}')
                    logger.debug((route_graph.nodes[node]['x'], route_graph.nodes[node]['y']))
                    logger.debug((node_x, node_y))
                    logger.debug((closest_x, closest_y, dist))
                    logger.debug('')
                    waypoints.append(f'{closest_y},{closest_x}')
            
            all_waypoints.append(waypoints)

        return all_waypoints


