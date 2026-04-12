import osmnx as ox          # Open Street Map Networks
import pyproj               # cartographic projections library
import networkx as nx       # Graph networks library
import time
import os
from typing import Set, List, Dict
import re
import json

from src.utils.constants import GRAPH_SIMPLIFICATION_DIST
from src.utils.get_directories import INTERMEDIATE_RESULTS_DIR
from src.public_407_data.interchanges import hwy_407_ref_to_name
from src.utils.setup_logger import get_logger
from src.types.types import InterchangeOfficialToRefMapping
logger = get_logger()

def download_initial_graph():
    ox.settings.use_cache = True # pyright: ignore[reportAttributeAccessIssue]
    ox.settings.log_console = False # pyright: ignore[reportAttributeAccessIssue]
    ox.settings.useful_tags_way += ['name', 'destination', 'highway', 'ref', 'toll'] # pyright: ignore[reportAttributeAccessIssue]
    ox.settings.useful_tags_node += ['name', 'destination', 'highway', 'ref'] # pyright: ignore[reportAttributeAccessIssue]
    # logger.debug(ox.settings.useful_tags_way) # type: ignore

    # Bounding Box to cover the entire 407 ETR (Burlington to Pickering)
    # Format: (west, south, east, north)
    bbox = (-79.95, 43.30, -79.05, 44.00)

    # Download graph
    logger.info('Loading graph')
    start_time = time.time()
    G = ox.graph_from_bbox(bbox=bbox, network_type='drive')

    end_time = time.time()
    elapsed = end_time - start_time

    logger.info(f"Graph downloaded in {elapsed:.2f} seconds")
    logger.info(f"Nodes: {len(G.nodes)}; Edges: {len(G.edges)}")

    # Save graph
    filename = "407_graph.graphml"
    logger.info('Saving graph')
    start_time = time.time()
    ox.save_graphml(G, INTERMEDIATE_RESULTS_DIR / filename)
    logger.info(f"Graph saved to {filename} in {time.time() - start_time} s")

    # Optional: print file size
    file_size = os.path.getsize(INTERMEDIATE_RESULTS_DIR / filename) / (1024 * 1024)
    logger.info(f"File size: {file_size:.2f} MB")

    return G

def extract_407_interchanges(G: nx.MultiDiGraph, toll_node_ids: set[int]):
    mapped_interchanges: list[InterchangeOfficialToRefMapping] = []

    for node_id in toll_node_ids:
        node_data = G.nodes[node_id]
        # logger.debug(node_data)
        if node_data.get('highway') != 'motorway_junction':
            continue

        # 1. Handle the KM (Ref)
        ref_str = str(node_data.get('ref', ''))
        if not ref_str:
            continue
        # Convert "34B" or "13" to a float
        km_from_ref = float(re.sub(r'[^0-9.]', '', ref_str))

        closest_official_km = min(hwy_407_ref_to_name.keys(), 
                                 key=lambda x: abs(x - km_from_ref))
        
        if abs(closest_official_km - km_from_ref) < 2.0:
            mapped_interchanges.append({
                "interchange_name": hwy_407_ref_to_name[closest_official_km],
                "official_km": closest_official_km,
                "ref_km": km_from_ref,
                "ref_str": ref_str,
                "node_id": node_id,
                "lat": node_data['y'],
                "lon": node_data['x'],
            })
            G.nodes[node_id]['interchange_name'] = hwy_407_ref_to_name[closest_official_km]
    return mapped_interchanges
    logger.info(json.dumps(mapped_interchanges))

    # Deduplicate and sort
    unique = {i['km']: i for i in mapped_interchanges}.values()
    return sorted(unique, key=lambda x: x['km'])



def tag_toll_nodes(G: nx.MultiDiGraph):
    # Find toll nodes
    toll_node_ids = set()
    non_toll_node_ids = set()
    marked_as_toll, ref_407, name_407 = 0, 0, 0

    for u, v, k, data in G.edges(keys=True, data=True):
        if data.get('toll') != 'yes':
            non_toll_node_ids.update([u, v])
            continue

        if 'ref' in data and '407' in str(data['ref']):
            # logger.debug(f'ref: {data=}')
            toll_node_ids.update([u, v])
            ref_407 += 1
        elif 'name' in data and '407' in str(data['name']):
            # logger.debug(f'name: {data=}')
            toll_node_ids.update([u, v])
            name_407 += 1
        

    logger.info(f'\tMarked as toll: {marked_as_toll}')
    logger.info(f'\tHas 407 ref: {ref_407}')
    logger.info(f'\tHas name 407: {name_407}')

    # Find toll entrances/exits
    entrance_exit_nodes = set()
    # Find toll entrances/exits
    entrance_exit_nodes = toll_node_ids.intersection(non_toll_node_ids)
    logger.info(f'\tGraph nodes: {len(G.nodes)}')
    logger.info(f'\tGraph toll nodes: {len(toll_node_ids)}')
    logger.info(f'\tGraph non toll nodes: {len(non_toll_node_ids)}')
    logger.info(f'\tGraph entrance/exit nodes {len(entrance_exit_nodes)}')

    for node in G.nodes:
        G.nodes[node]['tag'] = None
        if node in toll_node_ids:
            G.nodes[node]['tag'] = 'toll_route'
        # if node in entrance_exit_nodes:
        #     G.nodes[node]['tag'] = 'entrance_exit'

    return G, toll_node_ids, non_toll_node_ids

def filter_tagged_nodes(G: nx.MultiDiGraph, tag_filter: str) -> nx.MultiDiGraph:
    """
    Create a subgraph with only nodes matching the specified tag.
    
    Args:
        G: Input MultiDiGraph
        tag_filter: Tag value to filter nodes
    
    Returns:
        Filtered MultiDiGraph
    """
    # Get nodes matching the tag filter
    matching_nodes = [n for n, d in G.nodes(data=True) if d.get('tag') == tag_filter]
    
    return get_subgraph_copy(G, set(matching_nodes))

def get_subgraph_copy(G: nx.MultiDiGraph, node_subset: Set[int]):
    return nx.MultiDiGraph(G.subgraph(node_subset).copy())

def prune_toll_graph_non_junction_nodes(toll_graph: nx.MultiDiGraph):
    components = get_connected_components_dfs(toll_graph)
    new_edges = []
    nodes_to_keep = set()
    for component in components:
        start_node_is_junction = False
        cur_len = 0.0
        start_node_id = -1
        for i, node_id in enumerate(component):
            if start_node_is_junction:
                cur_len += toll_graph.adj[component[i - 1]][node_id][0]['length'] # type: ignore
            if start_node_is_junction and toll_graph.nodes[node_id].get('highway') == 'motorway_junction':
                new_edges.append(((start_node_id, node_id), cur_len))
                cur_len = 0.0
                start_node_id = node_id
                nodes_to_keep.add(node_id)
            if not start_node_is_junction and toll_graph.nodes[node_id].get('highway') == 'motorway_junction':
                start_node_is_junction = True
                cur_len = 0.0
                start_node_id = node_id
                nodes_to_keep.add(node_id)

    new_toll_graph = get_subgraph_copy(toll_graph, nodes_to_keep)
    for edge, length in new_edges:
        u, v = edge
        if v not in new_toll_graph.adj[u]:
            new_toll_graph.add_edge(u, v, length=length)
    
    return new_toll_graph

def prune_toll_graph_duplicate_interchange_labels(toll_graph: nx.MultiDiGraph, interchanges: list[InterchangeOfficialToRefMapping]):
    components = get_connected_components_dfs(toll_graph)
    new_edges = []
    nodes_to_keep = set()

    int_name_to_ref: dict[str, dict[int, tuple[float, float]]] = {}
    for x in interchanges:
        name = x['interchange_name']
        if name not in int_name_to_ref:
            int_name_to_ref[name] = {}
        int_name_to_ref[name][x['node_id']] = (x['official_km'], x['ref_km'])
        
    for _, component in enumerate(components):
        visited_interchanges: dict[str, set[int]] = {}
        for _, node_id in enumerate(component):
            if 'interchange_name' not in toll_graph.nodes[node_id]:
                continue
            interchange_name: str = toll_graph.nodes[node_id]['interchange_name']
            if interchange_name not in visited_interchanges:
                visited_interchanges[interchange_name] = set()
            visited_interchanges[interchange_name].add(node_id)
        
        ints_to_keep = set()
        for int_name, nodes_in_int in visited_interchanges.items():
            min_node = min(
                nodes_in_int, 
                key=lambda node: abs(int_name_to_ref[int_name][node][0] - int_name_to_ref[int_name][node][1])
            )
            ints_to_keep.add(min_node)

        cur_len = 0.0
        keep_track = False
        start_node_id = -1
        for i, node_id in enumerate(component):
            if keep_track:
                cur_len += toll_graph.adj[component[i - 1]][node_id][0]['length'] # type: ignore
            if keep_track and node_id in ints_to_keep:
                new_edges.append(((start_node_id, node_id), cur_len))
                cur_len = 0.0
                start_node_id = node_id
                nodes_to_keep.add(node_id)
            elif node_id in ints_to_keep:
                keep_track = True
                cur_len = 0.0
                start_node_id = node_id
                nodes_to_keep.add(node_id)

    new_toll_graph = get_subgraph_copy(toll_graph, nodes_to_keep)
    for edge, length in new_edges:
        u, v = edge
        if v not in new_toll_graph.adj[u]:
            new_toll_graph.add_edge(u, v, length=length)
    
    return new_toll_graph

def find_major_intersections(G: nx.MultiDiGraph, min_degree: int = 1):
    # Highway types considered "major"
    major_highway_types = {"motorway", "trunk", "primary", "secondary"}

    major_intersections = []

    for node in G.nodes:
        edges = G.edges(node, keys=True, data=True)
        major_count = sum(
            1 for _, _, _, d in edges
            if isinstance(d.get("highway"), str) and d.get('highway') in major_highway_types
            or isinstance(d.get('highway'), list) and any(
                hw in major_highway_types for hw in d.get('highway') # pyright: ignore[reportOptionalIterable]
            )
        )
        
        if major_count >= min_degree:
            major_intersections.append(node)
        
    return set(major_intersections)

def merge_nearby_nodes(
    G: nx.MultiDiGraph,
    merge_dist: float,
) -> nx.MultiDiGraph:
    crs = G.graph.get("crs")
    is_projected = pyproj.CRS(crs).is_projected
    # logger.debug((crs, "projected?", is_projected))
    if not is_projected:
        G = ox.project_graph(G)
    
    # nodes, edges = ox.graph_to_gdfs(G)
    # logger.debug(nodes.head())
    # logger.debug(nodes.columns)

    G_simplified = ox.simplification.consolidate_intersections(
        G,
        tolerance=merge_dist
    )
    assert isinstance(G_simplified, nx.MultiDiGraph)

    return ox.project_graph(G_simplified, to_crs=crs)

def get_mapping_of_merged_nodes(G: nx.MultiDiGraph, G_simplified: nx.MultiDiGraph):
    # Extract the mapping (New Node ID -> List of Old Node IDs)
    # The 'osmid_original' attribute can be a single value or a list.
    # We normalize it to always be a list for consistency.
    node_mapping: Dict[int, List[int]] = {}

    for node, data in G_simplified.nodes(data=True):
        original_ids = data.get("osmid_original")
        
        # If the node wasn't merged, osmid_original might not exist or be a single value
        if original_ids is None:
            # Fallback if attribute is missing (rare, but good for safety)
            assert False
            node_mapping[node] = [node]
        elif isinstance(original_ids, list):
            node_mapping[node] = original_ids
        else:
            # It's a single scalar value (e.g. an int or string)
            node_mapping[node] = [original_ids]

    # Example: Print first 5 mappings
    for new_id, old_ids in list(node_mapping.items()):
        logger.debug(f"New Node {new_id} contains original nodes: {old_ids}")
        for old_id in old_ids:
            new_x, new_y = G_simplified.nodes[new_id]['x'], G_simplified.nodes[new_id]['y']
            old_x, old_y = G.nodes[old_id]['x'], G.nodes[old_id]['y']
            
            logger.debug(f'results for node {new_id}')
            logger.debug((new_x, new_y))
            logger.debug((old_x, old_y))
            logger.debug(ox.distance.great_circle(new_y, new_x, old_y, old_x))
            logger.debug('')
    
    return node_mapping

def get_mapping_of_simplified_toll_nodes(full_graph: nx.MultiDiGraph, toll_graph: nx.MultiDiGraph):
    mapping = {}
    for node in toll_graph.nodes:
        assert node in full_graph.nodes
        mapping[node] = list(full_graph.predecessors(node)) + list(full_graph.successors(node)) + [node]
    return mapping

def simplify_toll_graph(toll_graph: nx.MultiDiGraph):
    components_dfs = get_connected_components_dfs(toll_graph)
    simplified_components = []
    full_edges_to_keep = []
    for component in components_dfs:
        simplified_component, edges_to_keep = simplify_node_chain(component, toll_graph)
        simplified_components.append(simplified_component)
        full_edges_to_keep += edges_to_keep
    simplified_nodes = set(node for component in simplified_components for node in component)
    simplified_toll_graph = get_subgraph_copy(toll_graph, simplified_nodes)
    for u, v, len_ in full_edges_to_keep:
        if v not in simplified_toll_graph[u]:
            simplified_toll_graph.add_edge(u, v, length=len_)

    return simplified_toll_graph, simplified_components

def simplify_node_chain(in_order_node_ids: List[int], graph: nx.MultiDiGraph, min_dist=GRAPH_SIMPLIFICATION_DIST):
    nodes_to_keep = [in_order_node_ids[0]]
    edges_to_keep = []
    prev_node = None
    cur_len = 0
    for i, node_id in enumerate(in_order_node_ids):
        if prev_node is None:
            prev_node = node_id
            continue
        # TODO: change to using length property?
        dist = ox.distance.great_circle(
            graph.nodes[prev_node]['y'],
            graph.nodes[prev_node]['x'],
            graph.nodes[node_id]['y'],
            graph.nodes[node_id]['x'],
        )
        cur_len += dist
        if dist >= min_dist or i == len(in_order_node_ids) - 1: # Guaruntee last node is added
            nodes_to_keep.append(node_id)
            edges_to_keep.append((prev_node, node_id, cur_len))
            prev_node = node_id
            cur_len = 0
    return nodes_to_keep, edges_to_keep

def correct_toll_graph(graph: nx.MultiDiGraph):
    """
    NOTE: This algorithm is specific to the 407 toll graph.
    Possible general strategy for removing cycles: for each node in the component,
    select it as the starting node for dfs traversal and
    check if len(dfs_preorder_nodes) == len(component).
    Then, follow the edges in that preorder and remove any extraneous edges
    """
    components = list(nx.weakly_connected_components(graph))

    for i, component in enumerate(components):
        if i == 0:
            continue
        ne_node = max(component,
            key=lambda n: (
                graph.nodes[n]['y'] if 'y' in graph.nodes[n] else float('inf'),
                graph.nodes[n]['x'] if 'x' in graph.nodes[n] else float('inf')
            )
        )
        dfs_nodes = list(nx.dfs_preorder_nodes(graph.to_undirected(), source=ne_node))
        for j, node in enumerate(dfs_nodes):
            edges_to_remove = []
            visited = set()
            for u, v, k in graph.out_edges(node, keys=True):
                if v in visited:
                    edges_to_remove.append((u, v, k))
                    continue
                visited.add(v)
                if v != dfs_nodes[j + 1]:
                    edges_to_remove.append((u, v, k))
            
            for u, v, k in edges_to_remove:
                graph.remove_edge(u, v, k)

    node_to_rid_map = {}
    for i, component in enumerate(components):
        for j, node in enumerate(component):
            node_to_rid_map[node] = f'{i}-{j}'
    
def get_connected_components_dfs(graph: nx.MultiDiGraph) -> List[List[int]]:
    G_undirected = graph.to_undirected()
    
    # Get connected components
    components = list(nx.weakly_connected_components(graph))
    
    result = []
    node_to_rid_map = {}
    for j, component in enumerate(components):
        starting_nodes = [
            node for node in component
            if graph.in_degree(node) == 0 and graph.out_degree(node) == 1
        ]

        assert len(starting_nodes) == 1, len(starting_nodes)
        dfs_nodes = list(nx.dfs_preorder_nodes(G_undirected, source=starting_nodes[0]))

        result.append(dfs_nodes)

    return result

# TODO: memoize? Need graphs to have a unique id? Or maybe just pass in the route idx?
# Prerequisite: route_graph has a single start and end node
def get_route_in_dfs_order(route_graph: nx.MultiDiGraph) -> list[int]:
    start_nodes = [node for node in route_graph.nodes if route_graph.in_degree(node) == 0]
    assert len(start_nodes) == 1
    start_node = start_nodes[0]
    dfs_nodes = nx.dfs_preorder_nodes(route_graph, start_node)
    return list(dfs_nodes)