import networkx as nx
from src.types.types import ConnectingRoutesType
from src.helpers.get_and_manipulate_graph import get_route_in_dfs_order
from src.utils.setup_logger import get_logger

type LatitudeType = float
type LongitudeType = float
type CoordType = tuple[LongitudeType, LatitudeType]

ORIGIN_ID = 0
DESTINATION_ID = 1

logger = get_logger()

class ConnectedRouteGraph:
    def __init__(
            self,
            route_graphs: list[nx.MultiDiGraph],
            origin: CoordType,
            destination: CoordType,
            connecting_routes: ConnectingRoutesType
        ) -> None:
        self.id_maps = self.relabel_nodes_in_dfs_order(route_graphs)

        self.graph = self.connect_parts(route_graphs, origin, destination, connecting_routes)
        self.connecting_routes = connecting_routes
        self.start_node_id = ORIGIN_ID
        self.end_node_id = DESTINATION_ID
        self.route_graph_dfs_node_ids: list[list[int]] = []

        all_nodes_len = sum(len(route_graph.nodes) for route_graph in route_graphs)
        assert len(self.graph.nodes) == all_nodes_len + 2, (len(self.graph.nodes), all_nodes_len)

        for route_graph in route_graphs:
            dfs_nodes = get_route_in_dfs_order(route_graph)
            self.route_graph_dfs_node_ids.append(
                [self.start_node_id] + dfs_nodes + [self.end_node_id]
            )
        

    def connect_parts(
            self,
            route_graphs: list[nx.MultiDiGraph],
            origin: CoordType,
            destination: CoordType,
            connecting_routes: ConnectingRoutesType
        ):
        """
        Composes all parts into a connected graph.
            - Step 1: Sets the union of route_graphs as the interior graph,
            - Step 2: adds new edges based from connecting_routes
            - Step 3: creates new nodes for origin and destination (and links them to interior route graph),
        """
        # Step 1:
        full_graph = nx.MultiDiGraph(nx.compose_all(route_graphs))
        all_nodes_len = sum(len(route_graph.nodes) for route_graph in route_graphs)

        assert len(full_graph.nodes) == all_nodes_len, (len(full_graph.nodes), all_nodes_len) #, shared_nodes)

        # Step 2:
        for route_connection in connecting_routes:
            mapped_start_id = self.id_maps[route_connection['start_node_route_idx']][route_connection['start_node_id']]
            mapped_end_id = self.id_maps[route_connection['end_node_route_idx']][route_connection['end_node_id']]
            full_graph.add_edge(mapped_start_id, mapped_end_id)

        # Step 3:
        nodes = set(full_graph.nodes)
        origin_id = ORIGIN_ID
        destination_id = DESTINATION_ID
        assert origin_id not in nodes and destination_id not in nodes

        full_graph.add_node(origin_id, x=origin[1], y=origin[0])
        full_graph.add_node(destination_id, x=destination[1], y=destination[0])

        for route_graph in route_graphs:
            dfs_nodes = get_route_in_dfs_order(route_graph)
            start_node = dfs_nodes[0]
            assert (
                start_node in full_graph.nodes
                and full_graph.nodes[start_node]['x'] == route_graph.nodes[start_node]['x']
                and full_graph.nodes[start_node]['y'] == route_graph.nodes[start_node]['y']
            )
            full_graph.add_edge(origin_id, start_node)

            end_node = dfs_nodes[-1]
            assert (
                end_node in full_graph.nodes
                and full_graph.nodes[end_node]['x'] == route_graph.nodes[end_node]['x']
                and full_graph.nodes[end_node]['y'] == route_graph.nodes[end_node]['y']
            )
            full_graph.add_edge(end_node, destination_id)
        
        return full_graph
        
    def relabel_nodes_in_dfs_order(self, route_graphs: list[nx.MultiDiGraph]):
        id_maps: list[dict[int, int]] = []
        for i, route_graph in enumerate(route_graphs):
            dfs_nodes = get_route_in_dfs_order(route_graph)
            new_id_mapping = {old_node_id: ((i + 1) * 10**6) + j for j, old_node_id in enumerate(dfs_nodes)}
            id_maps.append(new_id_mapping)
            route_graph.graph['my_id'] = f'G{i + 1}'
            nx.relabel_nodes(route_graph, new_id_mapping, copy=False)
        return id_maps