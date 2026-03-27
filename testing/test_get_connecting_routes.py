import folium
import seaborn as sns
from testing.test_get_route_graph import test_get_route_graph
from src.utils.visualize_graph import setup_folium_graph, visualize_graph
from src.utils.get_directories import TEST_OUTPUTS_FOLDER
from src.build_user_traffic_routes import (
    get_traffic_aware_durations,
    assign_durations_to_graph,
    get_connecting_routes,
    assign_toll_costs_to_graph,
    simplify_toll_graph_for_connecting_routes
)
from src.data_structures.connected_route_graph import ConnectedRouteGraph
from src.utils.setup_logger import get_logger

logger = get_logger()

def test_connecting_routes():
    route_graphs, route_polylines, origin, destination, departure_dttm, builder = test_get_route_graph()
    
    simp_route_graph = simplify_toll_graph_for_connecting_routes(route_graphs)
    connecting_routes = get_connecting_routes(simp_route_graph)
    traffic_aware_polylines, intra_route_section_data, inter_route_section_data = get_traffic_aware_durations(route_graphs, connecting_routes, origin, destination, route_polylines)
    connected_graph = ConnectedRouteGraph(route_graphs, origin, destination, connecting_routes)
    assign_durations_to_graph(connected_graph, intra_route_section_data, inter_route_section_data)

    logger.debug('NODE DATA:\n')
    toll_nodes = connected_graph.route_graph_dfs_node_ids[0][1:-1]
    for i, node_id in enumerate(toll_nodes):
        logger.debug((
            node_id,
            connected_graph.graph.nodes[node_id]['y'],
            connected_graph.graph.nodes[node_id]['x']
        ))
        # if i < len(toll_nodes) - 1:
        #     logger.debug(connected_graph.graph.adj[node_id][toll_nodes[i + 1]])

    assign_toll_costs_to_graph(connected_graph, departure_dttm)
    
    colours = ['green', 'blue', 'purple']
    m = setup_folium_graph(connected_graph.graph)

    num_lines = len(traffic_aware_polylines)
    colours = sns.color_palette("hls", 3).as_hex()

    # for i, graph in enumerate(route_graphs):
    #     m = visualize_graph(graph, m, colours[i], True, False)
    for i, polyline in enumerate(traffic_aware_polylines):
        if i <= 2:
            folium.PolyLine(polyline, color=colours[i], weight=3, opacity=0.8,tooltip=i).add_to(m)
    m = visualize_graph(connected_graph.graph, m, 'black', True)
    m.save(TEST_OUTPUTS_FOLDER / 'connected_route_graphs.html')


if __name__ == '__main__':
    test_connecting_routes()