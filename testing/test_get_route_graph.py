from build_route_graph import RouteGraphBuilder
import folium

from visualize_graph import setup_folium_graph, visualize_graph

def test_get_route_graph():
    origin = 43.393262, -79.802492  # Appleby Line entrance
    destination = 43.841385, -79.306418  # Kennedy Rd exit

    builder = RouteGraphBuilder()

    route_graphs, polylines = builder.get_full_route_graph(origin[0], origin[1], destination[0], destination[1])

    m = setup_folium_graph(builder.toll_graph)
    # m = visualize_graph(builder.toll_graph, m, 'red')
    # m = visualize_graph(builder.major_ints_graph, m, 'orange')
    colours = ['green', 'blue', 'purple']
    for i, graph in enumerate(route_graphs):
        m = visualize_graph(graph, m, colours[i], True, False)
    
    m.save('route_graphs.html')

    m = setup_folium_graph(builder.toll_graph)
    # m = visualize_graph(builder.toll_graph, m, 'red')
    # m = visualize_graph(builder.major_ints_graph, m, 'orange')
    for i, polyline in enumerate(polylines):
        folium.PolyLine(polyline, color=colours[i], weight=3, opacity=0.8,).add_to(m)

    m.save('route_polylines.html')

    return route_graphs, polylines, origin, destination


if __name__ == '__main__':
    test_get_route_graph()