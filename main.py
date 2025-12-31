from testing.test_get_simplified_gta_graph_network import test_get_simplified_gta_graph_network
from testing.test_get_route_graph import test_get_route_graph
from testing.test_get_connecting_routes import test_connecting_routes
import argparse

MIN_STEP = 1
MAX_STEP = 3
TEST_MODE = 'testing'

parser = argparse.ArgumentParser(description="GTA Commuter Buddy")

parser.add_argument('--test', '-t', action='store_true', default=True, help='Enable for testing mode')
parser.add_argument('--step', '-s', type=int, help=f'A test step between {MIN_STEP} and {MAX_STEP}')

args = parser.parse_args()

if not args.test:
    raise NotImplementedError('Only testing mode is implemented')
else:
    mode = TEST_MODE

if mode == TEST_MODE:
    if args.step is None:
        raise ValueError('Step is required for testing mode')
    
    match args.step:
        case 1:
            test_get_simplified_gta_graph_network()
        case 2:
            test_get_route_graph()
        case 3:
            test_connecting_routes()
        case _:
            raise ValueError('Invalid step')

