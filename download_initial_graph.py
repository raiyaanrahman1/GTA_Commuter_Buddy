import osmnx as ox
import time
import os
ox.settings.use_cache = True # pyright: ignore[reportAttributeAccessIssue]
ox.settings.log_console = False # pyright: ignore[reportAttributeAccessIssue]

def download_initial_graph():
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
