import folium

from src.build_user_route_graph import RouteGraphBuilder, NonTollRouteError
from src.utils.visualize_graph import setup_folium_graph, visualize_graph
from src.utils.get_directories import TEST_OUTPUTS_FOLDER
from datetime import datetime, timezone

from src.utils.setup_logger import get_logger

logger = get_logger()

def test_non_toll_route():
    origin = 43.54780801922797, -79.662844691281  # University of Toronto, Mississauga campus 
    destination = 43.591795393873824, -79.64721217055747  # Square One shopping mall

    builder = RouteGraphBuilder()

    departure_dttm = datetime.now(timezone.utc)
    departure_dttm_str = departure_dttm.isoformat()

    try:
        builder.get_full_route_graph(origin[0], origin[1], destination[0], destination[1], departure_dttm_str)
    except NonTollRouteError:
        logger.info('Passed Non-Toll Route test case')
        return
    
    assert False

def test_get_route_graph():
    origin = 43.393262, -79.802492  # Appleby Line entrance
    destination = 43.841385, -79.306418  # Kennedy Rd exit

    builder = RouteGraphBuilder()

    departure_dttm = datetime.now(timezone.utc)
    departure_dttm_str = departure_dttm.isoformat()
    route_graphs, polylines = builder.get_full_route_graph(origin[0], origin[1], destination[0], destination[1], departure_dttm_str)

    m = setup_folium_graph(builder.toll_graph)
    # m = visualize_graph(builder.toll_graph, m, 'red')
    # m = visualize_graph(builder.major_ints_graph, m, 'orange')
    colours = ['green', 'blue', 'purple']
    for i, graph in enumerate(route_graphs):
        m = visualize_graph(graph, m, colours[i], True, False)
    
    m.save(TEST_OUTPUTS_FOLDER / 'route_graphs.html')

    m = setup_folium_graph(builder.toll_graph)
    # m = visualize_graph(builder.toll_graph, m, 'red')
    # m = visualize_graph(builder.major_ints_graph, m, 'orange')
    for i, polyline in enumerate(polylines):
        folium.PolyLine(polyline, color=colours[i], weight=3, opacity=0.8,).add_to(m)

    m.save(TEST_OUTPUTS_FOLDER / 'route_polylines.html')

    return route_graphs, polylines, origin, destination, departure_dttm, builder


if __name__ == '__main__':
    test_get_route_graph()