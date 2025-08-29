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
    merge_nearby_nodes
)
from visualize_graph import visualize_graph
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
with Timer('Simplifying toll graph', 'Simplified toll graph'):
    simplified_toll_graph = merge_nearby_nodes(toll_graph, merge_dist=300)

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
center_lat = sum(node['y'] for node in toll_graph.nodes.values()) / len(toll_graph)
center_lon = sum(node['x'] for node in toll_graph.nodes.values()) / len(toll_graph)
m = folium.Map(location=[center_lat, center_lon], zoom_start=11, tiles="cartodbpositron")
with Timer('Plotting graph', 'Plotted graph'):
    # m = visualize_graph(G, m, 'gray')
    m = visualize_graph(major_int_graph_simplified, m, 'green')
    m = visualize_graph(toll_graph, m, 'blue', True, True)
    m = visualize_graph(simplified_toll_graph, m, 'red')
m.save('407_tagged_nodes_map.html')




