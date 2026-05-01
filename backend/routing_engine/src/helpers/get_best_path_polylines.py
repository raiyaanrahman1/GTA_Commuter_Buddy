from routing_engine.src.types.types import IntraRouteSectionData, InterRouteSectionData, PolylineType
from routing_engine.src.data_structures.connected_route_graph import ConnectedRouteGraph
from routing_engine.src.types.types import PathType

def map_route_polylines(
        intra_route_data: list[IntraRouteSectionData],
        inter_route_data: list[InterRouteSectionData],
        connected_graph: ConnectedRouteGraph
    ):
    intra_route_polylines: dict[int, dict[int, PolylineType]] = {}
    inter_route_polylines: dict[int, dict[int, PolylineType]] = {}
    for i, section_data in enumerate(intra_route_data):
        route_idx = section_data['route_idx']
        section_idx = section_data['section_idx']
        start_node_id = connected_graph.route_graph_dfs_node_ids[route_idx][section_idx]
        end_node_id = connected_graph.route_graph_dfs_node_ids[route_idx][section_idx + 1]

        if start_node_id not in intra_route_polylines:
            intra_route_polylines[start_node_id] = {}
        intra_route_polylines[start_node_id][end_node_id] = section_data['section_polyline']
    
    for i, section_data in enumerate(inter_route_data):
        start_route_idx = section_data['origin_route_idx']
        start_node_id = section_data['origin_node_id']
        end_route_idx = section_data['dest_route_idx']
        end_node_id = section_data['dest_node_id']

        start_node_id = connected_graph.id_maps[start_route_idx][start_node_id]
        end_node_id = connected_graph.id_maps[end_route_idx][end_node_id]
        
        if start_node_id not in inter_route_polylines:
            inter_route_polylines[start_node_id] = {}
        inter_route_polylines[start_node_id][end_node_id] = section_data['polyline']

    return intra_route_polylines, inter_route_polylines

def get_best_path_polylines(
    paths: list[PathType],
    intra_route_data: list[IntraRouteSectionData],
    inter_route_data: list[InterRouteSectionData],
    connected_graph: ConnectedRouteGraph,
):
    intra_route_polylines, inter_route_polylines = map_route_polylines(intra_route_data, inter_route_data, connected_graph)
    polylines: list[list[PolylineType]] = []

    for path, _, _ in paths:
        path_polylines: list[PolylineType] = []
        for i, node_id in enumerate(path[:-1]):
            section_polyline = None
            end_node = path[i + 1]
            if node_id in intra_route_polylines and end_node in intra_route_polylines[node_id]:
                section_polyline = intra_route_polylines[node_id][end_node]
            elif node_id in inter_route_polylines and end_node in inter_route_polylines[node_id]:
                section_polyline = inter_route_polylines[node_id][end_node]
            else:
                raise ValueError(f'Could not find corresponding polyline for node {node_id} to {end_node}')
            path_polylines.append(section_polyline)
        polylines.append(path_polylines)

    return polylines
