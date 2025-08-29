import osmnx as ox          # Open Street Map Networks
import pyproj               # cartographic projections library
import networkx as nx       # Graph networks library
import time
import os
from typing import Set

def download_initial_graph():
    ox.settings.use_cache = True # pyright: ignore[reportAttributeAccessIssue]
    ox.settings.log_console = False # pyright: ignore[reportAttributeAccessIssue]

    # Define bounding box (Appleby to Kennedy area)
    bbox = (-79.85, 43.35, -79.25, 43.95)  # (west, south, east, north)

    # Download graph
    print('Loading graph')
    start_time = time.time()
    G = ox.graph_from_bbox(bbox=bbox, network_type='drive')

    end_time = time.time()
    elapsed = end_time - start_time

    print(f"Graph downloaded in {elapsed:.2f} seconds")
    print(f"Nodes: {len(G.nodes)}; Edges: {len(G.edges)}")

    # Save graph
    filename = "407_graph.graphml"
    print('Saving graph')
    start_time = time.time()
    ox.save_graphml(G, filename)
    print(f"Graph saved to {filename} in {time.time() - start_time} s")

    # Optional: print file size
    file_size = os.path.getsize(filename) / (1024 * 1024)
    print(f"File size: {file_size:.2f} MB")

    return G


def tag_toll_nodes(G: nx.MultiDiGraph):
    # Find toll nodes
    toll_node_ids = set()
    non_toll_node_ids = set()
    marked_as_toll, ref_407, name_407 = 0, 0, 0

    for u, v, k, data in G.edges(keys=True, data=True):
        if data.get('toll') == 'yes':
            toll_node_ids.update([u, v])
            marked_as_toll += 1
        elif 'ref' in data and '407' in str(data['ref']):
            toll_node_ids.update([u, v])
            ref_407 += 1
        elif 'name' in data and '407' in str(data['name']):
            toll_node_ids.update([u, v])
            name_407 += 1
        else:
            non_toll_node_ids.update([u, v])
        

    print(f'\tMarked as toll: {marked_as_toll}')
    print(f'\tHas 407 ref: {ref_407}')
    print(f'\tHas name 407: {name_407}')

    # Find toll entrances/exits
    entrance_exit_nodes = set()
    # Find toll entrances/exits
    entrance_exit_nodes = toll_node_ids.intersection(non_toll_node_ids)
    print(f'\tGraph nodes: {len(G.nodes)}')
    print(f'\tGraph toll nodes: {len(toll_node_ids)}')
    print(f'\tGraph non toll nodes: {len(non_toll_node_ids)}')
    print(f'\tGraph entrance/exit nodes {len(entrance_exit_nodes)}')

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

def find_major_intersections(G: nx.MultiDiGraph, min_degree: int = 2):
    # Highway types considered "major"
    major_highway_types = {"motorway", "trunk", "primary", "secondary"}

    major_intersections = []

    for node in G.nodes:
        edges = G.edges(node, keys=True, data=True)
        major_count = sum(
            1 for _, _, _, d in edges
            if isinstance(d.get("highway"), str) and d.get('highway') in major_highway_types
            or isinstance(d.get('highway'), list) and any(
                hw in major_highway_types for hw in d.get('highway')
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
    # print(crs, "projected?", is_projected)
    if not is_projected:
        G = ox.project_graph(G)
    
    G_simplified = ox.simplification.consolidate_intersections(
        G,
        tolerance=merge_dist
    )
    assert isinstance(G_simplified, nx.MultiDiGraph)

    return ox.project_graph(G_simplified, to_crs=crs)