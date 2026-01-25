from typing import TypedDict

class RouteConnection(TypedDict):
    start_node_id: int
    start_node_route_idx: int
    end_node_id: int
    end_node_route_idx: int

type ConnectingRoutesType = list[RouteConnection]

class CoordDictType(TypedDict):
    lat: float
    lng: float

class IntraRouteSectionData(TypedDict):
    section_idx: int
    route_idx: int
    duration: int

class RouteApiSummaryType(TypedDict):
    duration: int
    baseDuration: int
    length: int

type PolylineType = list[tuple[float, float]]

class InterRouteSectionData(TypedDict):
    origin_node_id: int
    origin_route_idx: int
    dest_node_id: int
    dest_route_idx: int
    summary: RouteApiSummaryType
    polyline: PolylineType