from src.utils.visualize_graph import visualize_graph, setup_folium_graph
from src.utils.timer import Timer
from src.get_simplified_gta_graph_network import get_simplified_gta_graph_network
from src.helpers.get_and_manipulate_graph import get_subgraph_copy
from src.utils.get_directories import TEST_OUTPUTS_FOLDER

def test_get_simplified_gta_graph_network():
    (
        toll_graph,
        major_int_graph,
        major_int_graph_simplified,
        simplified_toll_graph,
        simplified_components
    ) = get_simplified_gta_graph_network()
    # Create a visualization and save it to an html file
    # Create base map centered on the graph
    m = setup_folium_graph(toll_graph)
    with Timer('Plotting graph', 'Plotted graph'):
        # m = visualize_graph(G, m, 'gray')
        # m = visualize_graph(major_int_graph_simplified, m, 'green')
        # m = visualize_graph(toll_graph, m, 'blue', True, True)
        toll_graph_comp1 = get_subgraph_copy(simplified_toll_graph, simplified_components[0])
        toll_graph_comp2 = get_subgraph_copy(simplified_toll_graph, simplified_components[1])
        m = visualize_graph(toll_graph_comp1, m, 'red')
        m = visualize_graph(toll_graph_comp2, m, 'purple')
    m.save(TEST_OUTPUTS_FOLDER / '407_tagged_nodes_map.html')

    m = setup_folium_graph(major_int_graph_simplified)
    m = visualize_graph(major_int_graph_simplified, m, 'green', True)
    m.save(TEST_OUTPUTS_FOLDER / 'major_intersections_simplified.html') 