
import osmnx as ox
import folium
import networkx as nx
import time

def visualize_graph(G: nx.MultiDiGraph, map: folium.Map, map_name, show_edges, show_non_toll = False):
    # Define tag colors
    tag_colors = {
        'toll_route': 'red',
        'entrance_exit': 'blue',
        'junction_to_toll': 'green',
        None: 'gray'  # for untagged
    }

    # Toggle visibility by commenting/uncommenting these
    visible_tags = {
        'toll_route': True,
        'entrance_exit': True,
        'junction_to_toll': True,
        None: show_non_toll  # Hide untagged nodes
    }

    # Plot nodes
    visible_nodes = set()
    for node, data in G.nodes(data=True):
        tag = data.get('tag', None)
        if visible_tags.get(tag, False):
            visible_nodes.add(node)
            folium.CircleMarker(
                location=(data['y'], data['x']),
                radius=2,
                color=tag_colors[tag],
                fill=True,
                fill_opacity=0.8,
                tooltip=tag
            ).add_to(map)

    if show_edges:
        for u, v, data in G.edges(data=True):
            if u in visible_nodes and v in visible_nodes:
                u_data = G.nodes[u]
                v_data = G.nodes[v]
                folium.PolyLine(
                    locations=[(u_data['y'], u_data['x']), (v_data['y'], v_data['x'])],
                    color='black',
                    weight=1,
                    opacity=0.4
                ).add_to(map)

    # Save map
    map.save(map_name)
    print(f"Map saved to {map_name}")
