from typing import TypedDict, Literal

from routing_engine.src.data_structures.connected_route_graph import ConnectedRouteGraph
from routing_engine.src.types.types import PolylineType, IntraRouteSectionData, InterRouteSectionData

class RouteState(TypedDict):
    metadata: Literal['TollRoute', 'NonTollRoute']
    connected_graph: ConnectedRouteGraph | None
    intra_route_section_data: list[IntraRouteSectionData] | None
    inter_route_section_data: list[InterRouteSectionData] | None
    total_cost: float | None
    best_route_per_budget: dict[float, list[PolylineType]]
    best_non_toll_route: list[PolylineType] | None
    potential_routes: list[PolylineType]