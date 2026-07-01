from routing_engine.src.types.types import PolylineType

class NonTollRouteError(Exception):
    def __init__(
            self,
            origin: str,
            dest: str,
            route_pline: PolylineType,
            potential_routes: list[PolylineType],
            message=None, *args
        ):
        if message is None:
            message = f'The route from {origin} to {dest} does not need to use Highway 407 ETR'
        super().__init__(message, *args)
        self.best_route_segments = [route_pline]
        self.potential_routes = potential_routes

class NodeMappingNotFoundError(Exception):
    def __init__(self, message=None, *args):
        if message is None:
            message = f'No nodes were mapped'
        super().__init__(message, *args)