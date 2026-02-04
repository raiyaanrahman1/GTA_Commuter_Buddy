from src.utils.setup_logger import get_logger
from datetime import datetime
import json

from src.get_toll_cost import get_toll_cost
logger = get_logger()

def cents_to_dollars(cents: float):
    return round(cents / 100, 2)


def test_get_toll_cost():
    curr_time = datetime.now()
    total_cost, cost_per_interchange = get_toll_cost('light', curr_time, 'east', 'Trafalgar Rd', 'Highway 401', 10.0*60)
    total_cost = cents_to_dollars(total_cost)
    logger.info(total_cost)
    logger.info(json.dumps(cost_per_interchange, indent=2))

    total_cost, cost_per_interchange = get_toll_cost('light', curr_time, 'west', 'Highway 401', 'Trafalgar Rd', 10.0*60)
    total_cost = cents_to_dollars(total_cost)
    logger.info(total_cost)
    logger.info(json.dumps(cost_per_interchange, indent=2))

    total_cost, cost_per_interchange = get_toll_cost('light', curr_time, 'east', 'QEW / Hwy 403', 'Brock Rd', 10.0*60)
    total_cost = cents_to_dollars(total_cost)
    logger.info(total_cost)
    logger.info(json.dumps(cost_per_interchange, indent=2))

    total_cost, cost_per_interchange = get_toll_cost('light', curr_time, 'west', 'Brock Rd', 'QEW / Hwy 403', 10.0*60)
    total_cost = cents_to_dollars(total_cost)
    logger.info(total_cost)
    logger.info(json.dumps(cost_per_interchange, indent=2))