from pydantic import BaseModel, Field
from datetime import datetime
from routing_engine.src.types.types import PolylineType
from typing import Literal, Any


class RouteRequest(BaseModel):
    origin: tuple[float, float] = Field(examples=[(43.393262, -79.802492)])
    destination: tuple[float, float] = Field(examples=[(43.841385, -79.306418)])
    departure_dttm: datetime = Field(examples=[datetime(2026, 3, 30, 7, 10)])
    budget: float

class LineStringGeometry(BaseModel):
    type: Literal["LineString"] = "LineString"
    coordinates: list[tuple[float, float]] # List of [longitude, latitude]

# 2. Define the Feature Model
class RouteFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    geometry: LineStringGeometry
    properties: dict[str, Any] = Field(
        default_factory=dict, 
        description="Include 'route_type': 'best' or 'potential' here"
    )

class FeatureCollection(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[RouteFeature]

# 3. Define the FeatureCollection (The final response model)
class RouteResponse(BaseModel):
    data: FeatureCollection
    metadata: str
    toll_cost: float