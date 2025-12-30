import folium
from visualize_graph import setup_folium_graph, visualize_graph
from test_get_route_graph import test_get_route_graph
from get_connecting_routes import build_connected_graph, get_traffic_aware_durations

def test_connecting_routes():
    route_graphs, route_polylines, origin, destination = test_get_route_graph()
    full_graph, connecting_routes = build_connected_graph(route_graphs, origin, destination)
    connecting_routes = []
    traffic_aware_polylines = get_traffic_aware_durations(route_graphs, connecting_routes, origin, destination, route_polylines)
    
    colours = ['green', 'blue', 'purple']
    m = setup_folium_graph(full_graph)
    # for i, graph in enumerate(route_graphs):
    #     m = visualize_graph(graph, m, colours[i], True, False)
    for i, polyline in enumerate(traffic_aware_polylines):
        folium.PolyLine(polyline, color=colours[i], weight=3, opacity=0.8,).add_to(m)
    m = visualize_graph(full_graph, m, 'orange', True)
    m.save('connected_route_graphs.html')


if __name__ == '__main__':
    test_connecting_routes()