import os
import osmnx as ox          # Open Street Map Networks
import networkx as nx       # Graph networks library
import folium               # Interactive map visualization library
from get_and_manipulate_graph import (
    download_initial_graph,
    tag_toll_nodes,
    filter_tagged_nodes,
    find_major_intersections,
    get_subgraph_copy,
    merge_nearby_nodes,
    get_connected_components_dfs,
    correct_toll_graph,
    simplify_node_chain
)
from visualize_graph import visualize_graph, setup_folium_graph
from timer import Timer
REDOWNLOAD_GRAPH = False

# Step 1: Get initial graph of GTA area with 407
initial_graph_file_path = "407_graph.graphml"
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
    # simplified_toll_graph = merge_nearby_nodes(toll_graph, merge_dist=300)
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

major_intersections = find_major_intersections(G)
major_int_graph = get_subgraph_copy(G, major_intersections)
major_int_graph_simplified = major_int_graph

with Timer('Simplifying major intersection graph', 'Simplified major intersection graph'):
    major_int_graph_simplified = merge_nearby_nodes(major_int_graph, merge_dist=50)

# Step 4: Save graphs and print details
ox.save_graphml(major_int_graph_simplified, 'major_intersections_simplified.graphml')
ox.save_graphml(simplified_toll_graph, 'simplified_toll_graph.graphml')
print(f'Length of original full graph: {len(G.nodes)}')
print(f'Length of toll graph: {len(toll_graph.nodes)}')
print(f'Length of simplified toll graph: {len(simplified_toll_graph)}')
print(f'Major intersections identified: {len(major_intersections)}')
print(f'Simplified intersections: {len(major_int_graph_simplified)}')

# Step 5: Create a visualization and save it to an html file
# Create base map centered on the graph
m = setup_folium_graph(toll_graph)
with Timer('Plotting graph', 'Plotted graph'):
    # m = visualize_graph(G, m, 'gray')
    # m = visualize_graph(major_int_graph_simplified, m, 'green')
    m = visualize_graph(toll_graph, m, 'blue', True, True)
    m = visualize_graph(simplified_toll_graph, m, 'red')
m.save('407_tagged_nodes_map.html')

m = setup_folium_graph(major_int_graph_simplified)
m = visualize_graph(major_int_graph_simplified, m, 'green', True)
m.save('major_intersections_simplified.html')




