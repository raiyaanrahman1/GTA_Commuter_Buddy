import os
import osmnx as ox
import time
import folium
from get_and_manipulate_graph import download_initial_graph, tag_graph, prune_close_connected_toll_nodes
from visualize_graph import visualize_graph
REDOWNLOAD_GRAPH = False

initial_graph_file_path = "407_graph.graphml"
if not os.path.exists(initial_graph_file_path) or REDOWNLOAD_GRAPH:
    G = download_initial_graph()
else:
    print('Loading initial graph')
    start_time = time.time()
    G = ox.load_graphml(initial_graph_file_path)
    print(f'Loaded graph in {time.time() - start_time} s')

start_time = time.time()
G, toll_node_ids, non_toll_node_ids = tag_graph(G)
print(f'tagged graph in {time.time() - start_time} s')

prune_close_connected_toll_nodes(G)

# Create base map centered on the graph
# center_lat = sum(node['y'] for node in G.nodes.values()) / len(G)
# center_lon = sum(node['x'] for node in G.nodes.values()) / len(G)
# m = folium.Map(location=[center_lat, center_lon], zoom_start=11, tiles="cartodbpositron")
# print('Plotting graph')
# start_time = time.time()
# visualize_graph(G, m, '407_tagged_nodes_map.html', False)
# print(f'Plotted graph in {time.time() - start_time} s')




