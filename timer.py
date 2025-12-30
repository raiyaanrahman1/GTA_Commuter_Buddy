import time
from setup_logger import get_logger
logger = get_logger()

class Timer:
    def __init__(self, start_message: str, end_message: str) -> None:
        self.start_message = start_message
        self.end_message = end_message

    def __enter__(self):
        logger.info(self.start_message)
        self.start_time = time.time()

    def __exit__(self, exc_type, exc_val, exc_tb):
        logger.info(f'{self.end_message} in {time.time() - self.start_time} seconds')