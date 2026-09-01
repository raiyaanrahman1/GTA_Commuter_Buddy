
import osmnx as ox
import folium
from folium import plugins
import networkx as nx
import time
from dotenv import load_dotenv
import os

load_dotenv()
CARTO_API_KEY = os.getenv('CARTO_API_KEY')

tiles_url = f"https://basemaps.cartocdn.com/rastertiles/voyager/{{z}}/{{x}}/{{y}}.png?key={CARTO_API_KEY}"
attribution = '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors &copy; <a href="https://carto.com">CARTO</a>'

def setup_folium_graph(G: nx.MultiDiGraph):
    center_lat = sum(node['y'] for node in G.nodes.values()) / len(G)
    center_lon = sum(node['x'] for node in G.nodes.values()) / len(G)
    m = folium.Map(location=[center_lat, center_lon], zoom_start=11,
        tiles=tiles_url,
        attr=attribution
    )
    return m

def visualize_graph(G: nx.MultiDiGraph, map: folium.Map, node_colour, show_edges = False, show_direction = False, radius=2.0):
    # Plot nodes
    for node, data in G.nodes(data=True):
        # tag = data.get('tag', None)
        tag = node
        folium.CircleMarker(
            location=(data['y'], data['x']),
            radius=radius,
            color=node_colour,
            fill=True,
            fill_opacity=0.8,
            tooltip=tag
        ).add_to(map)

    if show_edges:
        for u, v, data in G.edges(data=True):
            u_data = G.nodes[u]
            v_data = G.nodes[v]

            duration = data.get('duration', None)
            # Create polyline
            line = folium.PolyLine(
                locations=[(u_data['y'], u_data['x']), (v_data['y'], v_data['x'])],
                color='black',
                weight=1,
                opacity=0.4,
                tooltip=duration
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
