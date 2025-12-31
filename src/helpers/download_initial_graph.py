import osmnx as ox
import time
import os
ox.settings.use_cache = True # pyright: ignore[reportAttributeAccessIssue]
ox.settings.log_console = False # pyright: ignore[reportAttributeAccessIssue]

from get_directories import INTERMEDIATE_RESULTS_DIR
from setup_logger import get_logger
logger = get_logger()

def download_initial_graph():
    # Define bounding box (Appleby to Kennedy area)
    bbox = (-79.85, 43.35, -79.25, 43.95)  # (west, south, east, north)

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
    file_size = os.path.getsize(filename) / (1024 * 1024)
    logger.info(f"File size: {file_size:.2f} MB")

    return G
