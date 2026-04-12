import requests
import os
from dotenv import load_dotenv
import json
from src.utils.setup_logger import get_logger
from datetime import datetime, timezone

logger = get_logger()

def playground_test():
    load_dotenv()
    HERE_API_KEY = os.getenv('HERE_API_KEY')
    ROUTING_URL = "https://router.hereapi.com/v8/routes"

    departure_time = datetime.now(timezone.utc).isoformat()


    params = {
        "origin": "43.33088,-79.84022",      # Burlington Start
        "destination": "43.89615,-79.08535", # Pickering End
        "transportMode": "car",
        "return": "tolls,polyline,summary,actions",      # Requesting spans is key for interchange detail
        "spans": "names,length",             # This returns the name of every ramp/road segment
        "departureTime": departure_time,              # Or use a specific date/time for weekend rates
        "apiKey": HERE_API_KEY
    }

    r = requests.get(ROUTING_URL, params=params)
    # print(r.text)
    r.raise_for_status()
    route = r.json()
    response = json.dumps(route)
    logger.debug(response)