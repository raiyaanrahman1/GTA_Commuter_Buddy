import osmnx as ox
import networkx as nx
import time
import os
from typing import Optional, List

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


def tag_graph(G: nx.MultiDiGraph):
    # Find toll nodes
    print('Finding Toll nodes and tagging graph')
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
        

    print(f'Marked as toll: {marked_as_toll}')
    print(f'Has 407 ref: {ref_407}')
    print(f'Has name 407: {name_407}')

    # Find toll entrances/exits
    entrance_exit_nodes = set()
    # Find toll entrances/exits
    entrance_exit_nodes = toll_node_ids.intersection(non_toll_node_ids)
    print(f'Graph nodes: {len(G.nodes)}')
    print(f'Graph toll nodes: {len(toll_node_ids)}')
    print(f'Graph non toll nodes: {len(non_toll_node_ids)}')
    print(f'Graph entrance/exit nodes {len(entrance_exit_nodes)}')

    for node in G.nodes:
        G.nodes[node]['tag'] = None
        if node in toll_node_ids:
            G.nodes[node]['tag'] = 'toll_route'
        # if node in entrance_exit_nodes:
        #     G.nodes[node]['tag'] = 'entrance_exit'

    return G, toll_node_ids, non_toll_node_ids

import osmnx as ox
import networkx as nx
from typing import List

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
    
    # Create induced subgraph
    G_filtered = G.subgraph(matching_nodes).copy()
    
    # Ensure the result is a MultiDiGraph
    return nx.MultiDiGraph(G_filtered)

def get_connected_components_dfs(G: nx.MultiDiGraph) -> List[List[int]]:
    """
    Find all connected components in DFS order, starting from the SW-most node in each.
    
    Args:
        G: Input MultiDiGraph
        
    Returns:
        List of lists containing nodes in DFS order for each component
    """
    # Get undirected view for connectivity
    G_undirected = G.to_undirected()
    
    # Get connected components
    components = list(nx.weakly_connected_components(G))
    
    result = []
    for component in components:
        # Find SW-most node in the component
        sw_node = min(component,
                     key=lambda n: (
                         G.nodes[n]['y'] if 'y' in G.nodes[n] else float('inf'),
                         G.nodes[n]['x'] if 'x' in G.nodes[n] else float('inf')
                     ))
        
        # Get DFS nodes starting from SW-most node
        dfs_nodes = list(nx.dfs_preorder_nodes(G_undirected, source=sw_node))
        
        # Filter to only include nodes in this component
        dfs_nodes = [n for n in dfs_nodes if n in component]
        
        result.append(dfs_nodes)
    
    return result

def prune_close_connected_toll_nodes(G: nx.MultiDiGraph):
    tagged_graph = filter_tagged_nodes(G, 'toll_route')
    components = get_connected_components_dfs(tagged_graph)

    for component in components:
        print(len(component))
        print([(G.nodes[node]['x'], G.nodes[node]['y']) for node in component[:5]])
        print([(G.nodes[node]['x'], G.nodes[node]['y']) for node in component[-5:]])

    # TODO: implement

