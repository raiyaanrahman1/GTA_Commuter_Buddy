import logging
import os
from datetime import datetime

LOGGER_NAME = 'GTA_ROUTING_APP'
logger_setup = False

# --- Logging Setup (place this early in your script) ---
def setup_logging():
    # Create timestamp for this run
    now = datetime.now()
    
    # Date part: MM--DD--YYYY (e.g., 12--29--2025)
    date_str = now.strftime('%m-%d-%Y')
    
    # Time part for run: HHMMSS (e.g., 143022)
    time_str = now.strftime('%H-%M-%S')
    
    # Full paths
    day_dir = os.path.join('logs', f'logs_{date_str}')                  # logs/12--29--2025
    run_dir = os.path.join(day_dir, f'logs_{time_str}')       # logs/12--29--2025/logs_143022
    
    # Create directories (exist_ok handles races safely)
    os.makedirs(run_dir, exist_ok=True)
    
    # File paths
    debug_file = os.path.join(run_dir, 'debug_detailed.log')
    info_file = os.path.join(run_dir, 'info_detailed.log')
    debug_simple_file = os.path.join(run_dir, 'debug_simple.log')
    info_simple_file = os.path.join(run_dir, 'info_simple.log')

    
    # Get (or create) the logger
    logger = logging.getLogger(LOGGER_NAME)  # Use a name like your app name
    logger.setLevel(logging.DEBUG)  # Allow all levels to propagate
    
    # Clear any existing handlers (important if module is reloaded or in Jupyter)
    logger.handlers.clear()

    # --- Aligned format for debug.log (detailed) ---
    debug_format = (
        '%(asctime)s | '                  # 2025-12-29 14:30:22,123
        '%(levelname)-8s | '              # DEBUG   (left-aligned, 8 chars)
        '%(filename)-40s | '              # main.py             (left-aligned, 20 chars)
        '%(funcName)-40s | '              # main                (optional)
        '%(lineno)-4d | '                 # 123 
        '%(message)s'
    )
    
    # --- Cleaner aligned format for info.log and console ---
    info_format = (
        '%(asctime)s | '
        '%(levelname)-8s | '
        '%(filename)-40s | '
        '%(message)s'
    )
    
    # --- Debug Handler (DEBUG+) ---
    debug_handler = logging.FileHandler(debug_file)
    debug_handler.setLevel(logging.DEBUG)
    debug_formatter = logging.Formatter(debug_format)
    debug_handler.setFormatter(debug_formatter)
    logger.addHandler(debug_handler)
    
    # --- Info Handler (INFO+) ---
    info_handler = logging.FileHandler(info_file)
    info_handler.setLevel(logging.INFO)
    info_formatter = logging.Formatter(info_format)
    info_handler.setFormatter(info_formatter)
    logger.addHandler(info_handler)

    simple_formatter = logging.Formatter('%(levelname)s: %(message)s')

    # --- Debug Simple Handler (DEBUG+) ---
    debug_simple_handler = logging.FileHandler(debug_simple_file)
    debug_simple_handler.setLevel(logging.DEBUG)
    debug_simple_handler.setFormatter(simple_formatter)
    logger.addHandler(debug_simple_handler)
    
    # --- Info Handler (INFO+) ---
    info_simple_handler = logging.FileHandler(info_simple_file)
    info_simple_handler.setLevel(logging.INFO)
    info_simple_handler.setFormatter(simple_formatter)
    logger.addHandler(info_simple_handler)
    
    # --- Console output (INFO+) ---
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(simple_formatter)
    logger.addHandler(console_handler)

    return logger

def get_logger():
    global logger_setup
    if not logger_setup:
        logger = setup_logging()
        logger_setup = True
    else:
        logger = logging.getLogger(LOGGER_NAME)
    return logger

