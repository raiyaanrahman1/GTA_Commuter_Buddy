import os
import osmnx as ox          # Open Street Map Networks
import networkx as nx       # Graph networks library
import json

from src.helpers.get_and_manipulate_graph import (
    download_initial_graph,
    tag_toll_nodes,
    filter_tagged_nodes,
    find_major_intersections,
    get_subgraph_copy,
    merge_nearby_nodes,
    correct_toll_graph,
    get_mapping_of_merged_nodes,
    simplify_toll_graph,
    get_mapping_of_simplified_toll_nodes
)

from src.utils.timer import Timer
from src.utils.get_directories import INTERMEDIATE_RESULTS_DIR
from src.utils.setup_logger import get_logger
logger = get_logger()
REDOWNLOAD_GRAPH = False

def get_simplified_gta_graph_network():
    # Step 1: Get initial graph of GTA area with 407
    initial_graph_file_path = INTERMEDIATE_RESULTS_DIR / "407_graph.graphml"
    if not os.path.exists(initial_graph_file_path) or REDOWNLOAD_GRAPH:
        G = download_initial_graph()
    else:
        with Timer('Loading initial graph', 'Loaded graph'):
            G = ox.load_graphml(initial_graph_file_path)

    # Step 2: Tag toll nodes
    with Timer('Finding Toll nodes and tagging graph', 'Tagged graph'):
        G, toll_node_ids, non_toll_node_ids = tag_toll_nodes(G)

    # Step 3: Get separate 407 and major intersection graphs and simplify them
    toll_graph = filter_tagged_nodes(G, 'toll_route')
    correct_toll_graph(toll_graph)
    with Timer('Simplifying toll graph', 'Simplified toll graph'):
        simplified_toll_graph, simplified_components = simplify_toll_graph(toll_graph)
        toll_node_mapping = get_mapping_of_simplified_toll_nodes(toll_graph, simplified_toll_graph)

    major_intersections = find_major_intersections(G)
    major_int_graph = get_subgraph_copy(G, major_intersections)
    major_int_graph_simplified = major_int_graph

    with Timer('Simplifying major intersection graph', 'Simplified major intersection graph'):
        major_int_graph_simplified = merge_nearby_nodes(major_int_graph, merge_dist=50)
        node_mapping = get_mapping_of_merged_nodes(major_int_graph, major_int_graph_simplified)

    # Step 4: Save graphs and print details
    ox.save_graphml(toll_graph, INTERMEDIATE_RESULTS_DIR / 'full_toll_graph.graphml')
    ox.save_graphml(major_int_graph, INTERMEDIATE_RESULTS_DIR / 'major_intersections.graphml')
    ox.save_graphml(major_int_graph_simplified, INTERMEDIATE_RESULTS_DIR / 'major_intersections_simplified.graphml')
    ox.save_graphml(simplified_toll_graph, INTERMEDIATE_RESULTS_DIR / 'simplified_toll_graph.graphml')

    with Timer('Saving Intersection Simplification Mapping', 'Saved Intersection Simplification Mapping'):
        with open(INTERMEDIATE_RESULTS_DIR / 'intersection_simplification_mapping.json', 'w', encoding='utf-8') as f:
            json.dump(node_mapping, f, indent=2)

        with open(INTERMEDIATE_RESULTS_DIR / 'toll_nodes_simplification_mapping.json', 'w', encoding='utf-8') as f:
            json.dump(toll_node_mapping, f, indent=2)

    logger.info(f'Length of original full graph: {len(G.nodes)}')
    logger.info(f'Length of toll graph: {len(toll_graph.nodes)}')
    logger.info(f'Length of simplified toll graph: {len(simplified_toll_graph)}')
    logger.info(f'Major intersections identified: {len(major_intersections)}')
    logger.info(f'Simplified intersections: {len(major_int_graph_simplified)}')

    return toll_graph, major_int_graph, major_int_graph_simplified, simplified_toll_graph, simplified_components




