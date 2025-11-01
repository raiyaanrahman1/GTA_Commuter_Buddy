import osmnx as ox          # Open Street Map Networks
import pyproj               # cartographic projections library
import networkx as nx       # Graph networks library
import time
import os
from typing import Set, List
from constants import GRAPH_SIMPLIFICATION_DIST

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
    
    # nodes, edges = ox.graph_to_gdfs(G)
    # print(nodes.head())
    # print(nodes.columns)

    G_simplified = ox.simplification.consolidate_intersections(
        G,
        tolerance=merge_dist
    )
    assert isinstance(G_simplified, nx.MultiDiGraph)

    return ox.project_graph(G_simplified, to_crs=crs)

def simplify_node_chain(in_order_node_ids: List[int], graph: nx.MultiDiGraph, min_dist=GRAPH_SIMPLIFICATION_DIST):
    nodes_to_keep = [in_order_node_ids[0]]
    edges_to_keep = []
    prev_node = None
    cur_len = 0
    for node_id in in_order_node_ids:
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
        if dist >= min_dist:
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