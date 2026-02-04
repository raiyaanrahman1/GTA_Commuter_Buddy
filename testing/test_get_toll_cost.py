from src.utils.setup_logger import get_logger
from datetime import datetime

from src.get_toll_cost import get_toll_cost
logger = get_logger()

def cents_to_dollars(cents: float):
    return round(cents / 100, 2)


def test_get_toll_cost():
    curr_time = datetime.now()
    result = get_toll_cost('light', curr_time, 'east', 'Trafalgar Rd', 'Highway 401', 10.0*60)
    result = cents_to_dollars(result)
    logger.info(result)

    result = get_toll_cost('light', curr_time, 'west', 'Highway 401', 'Trafalgar Rd', 10.0*60)
    result = cents_to_dollars(result)
    logger.info(result)

    result = get_toll_cost('light', curr_time, 'east', 'QEW / Hwy 403', 'Brock Rd', 10.0*60)
    result = cents_to_dollars(result)
    logger.info(result)

    result = get_toll_cost('light', curr_time, 'west', 'Brock Rd', 'QEW / Hwy 403', 10.0*60)
    result = cents_to_dollars(result)
    logger.info(result)