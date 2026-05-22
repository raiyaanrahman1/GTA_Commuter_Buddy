class NonTollRouteError(Exception):
    def __init__(self, origin: str, dest: str, message=None, *args):
        if message is None:
            message = f'The route from {origin} to {dest} does not need to use Highway 407 ETR'
        super().__init__(message, *args)

class NodeMappingNotFoundError(Exception):
    def __init__(self, message=None, *args):
        if message is None:
            message = f'No nodes were mapped'
        super().__init__(message, *args)