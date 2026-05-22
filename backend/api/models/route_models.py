from pydantic import BaseModel
from datetime import datetime
from routing_engine.src.types.types import PolylineType


class RouteRequest(BaseModel):
    origin: tuple[float, float]
    destination: tuple[float, float]
    departure_dttm: datetime
    budget: float

class RouteResponse(BaseModel):
    potential_routes: list[PolylineType]
    best_route_segments: list[PolylineType]