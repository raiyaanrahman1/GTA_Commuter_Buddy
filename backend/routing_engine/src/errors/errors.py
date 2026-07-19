from routing_engine.src.types.types import PolylineType

class NonTollRouteError(Exception):
    def __init__(
            self,
            origin: str,
            dest: str,
            best_route_idx: int,
            potential_routes: list[PolylineType],
            durations: list[int],
            message=None, *args
        ):
        if message is None:
            message = f'The route from {origin} to {dest} does not need to use Highway 407 ETR'
        super().__init__(message, *args)
        self.potential_routes = potential_routes
        self.durations = durations
        self.best_route_idx = best_route_idx

class NodeMappingNotFoundError(Exception):
    def __init__(self, message=None, *args):
        if message is None:
            message = f'No nodes were mapped'
        super().__init__(message, *args)