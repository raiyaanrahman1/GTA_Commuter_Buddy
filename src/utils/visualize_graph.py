
import osmnx as ox
import folium
from folium import plugins
import networkx as nx
import time

def setup_folium_graph(G: nx.MultiDiGraph):
    center_lat = sum(node['y'] for node in G.nodes.values()) / len(G)
    center_lon = sum(node['x'] for node in G.nodes.values()) / len(G)
    m = folium.Map(location=[center_lat, center_lon], zoom_start=11, tiles="cartodbpositron")
    return m

def visualize_graph(G: nx.MultiDiGraph, map: folium.Map, node_colour, show_edges = False, show_direction = False):
    # Plot nodes
    for node, data in G.nodes(data=True):
        tag = data.get('tag', None)
        folium.CircleMarker(
            location=(data['y'], data['x']),
            radius=2,
            color=node_colour,
            fill=True,
            fill_opacity=0.8,
            tooltip=tag
        ).add_to(map)

    if show_edges:
        for u, v, data in G.edges(data=True):
            u_data = G.nodes[u]
            v_data = G.nodes[v]

            # Create polyline
            line = folium.PolyLine(
                locations=[(u_data['y'], u_data['x']), (v_data['y'], v_data['x'])],
                color='black',
                weight=1,
                opacity=0.4
            ).add_to(map)

            if show_direction:
                # Add arrow symbols
                plugins.PolyLineTextPath(
                    line,
                    '▶',  # Arrow character
                    repeat=False,
                    center=True,
                    # offset=12,
                    attributes={
                        'fill': 'black',
                        # 'font-weight': 'bold',
                        'font-size': '6'
                        }
                ).add_to(map)
    
    return map
