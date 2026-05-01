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

class RouteApiSummaryType(TypedDict):
    duration: int
    baseDuration: int
    length: int

type PolylineType = list[tuple[float, float]]

class IntraRouteSectionData(TypedDict):
    section_idx: int
    route_idx: int
    duration: int
    section_polyline: PolylineType

class InterRouteSectionData(TypedDict):
    origin_node_id: int
    origin_route_idx: int
    dest_node_id: int
    dest_route_idx: int
    summary: RouteApiSummaryType
    polyline: PolylineType

class InterchangeOfficialToRefMapping(TypedDict):
    interchange_name: str
    official_km: float
    ref_km: float
    ref_str: str
    node_id: int
    lat: float
    lon: float

class CostPerInterchange(TypedDict):
    portion_start_interchange: str
    portion_end_interchange: str
    cost_in_portion: float

type PathType = tuple[list[int], int, float]