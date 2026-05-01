from src.utils.setup_logger import get_logger
from datetime import datetime, timedelta
from typing import Literal, TypedDict, Optional
import pandas as pd
from pathlib import Path
import re
from zoneinfo import ZoneInfo

from src.public_407_data.interchanges import HWY_407_INTERCHANGES
from src.utils.get_directories import LIGHTWEIGHT_RATES_DIR
from src.types.types import CostPerInterchange

logger = get_logger()


# Define the return types
class TimeParts(TypedDict):
    start_val: str
    start_ampm: str
    end_val: str
    end_ampm: str

class TimeRangeParsed(TypedDict):
    id: int
    full_range: str
    start: str
    end: str
    parts: TimeParts
    start_dttm: datetime
    end_dttm: datetime

# Compile regex once for performance
# Matches: Group 1(Hour/Min), Group 2(am/pm), Group 3(Hour/Min), Group 4(am/pm)
TIME_REGEX = re.compile(r"(\d{1,2}(?::\d{2})?)([ap]m)-(\d{1,2}(?::\d{2})?)([ap]m)", re.IGNORECASE)

def _convert_to_24h(time_str: str, period: str) -> tuple[int, int]:
    """Helper to convert '10:30'/'am' to (10, 30) integers."""
    period = period.lower()
    if ":" in time_str:
        h, m = map(int, time_str.split(":"))
    else:
        h, m = int(time_str), 0
    
    if period == "pm" and h != 12:
        h += 12
    elif period == "am" and h == 12:
        h = 0
    return h, m

def parse_time_range(range_str: str, departure_dttm: datetime) -> Optional[TimeRangeParsed]:
    match = TIME_REGEX.match(range_str)
    if not match:
        return None

    # 1. Convert departure to Toronto Time
    toronto_tz = ZoneInfo("America/Toronto")
    local_ref = departure_dttm.astimezone(toronto_tz)
    
    # 2. Extract string parts from regex
    s_val, s_ampm, e_val, e_ampm = match.groups()
    
    # 3. Calculate hours/minutes
    s_hour, s_min = _convert_to_24h(s_val, s_ampm)
    e_hour, e_min = _convert_to_24h(e_val, e_ampm)
    
    # 4. Create datetime objects using the same year/month/day as local_ref
    # Note: If a range like "9pm-5am" is provided, the end_dttm will still 
    # be on the same day as start_dttm per your requirement.
    start_dttm = local_ref.replace(hour=s_hour, minute=s_min, second=0, microsecond=0)
    end_dttm = local_ref.replace(hour=e_hour, minute=e_min, second=0, microsecond=0)

    return {
        "id": -1,
        "full_range": range_str,
        "start": f"{s_val}{s_ampm}",
        "end": f"{e_val}{e_ampm}",
        "parts": {
            "start_val": s_val,
            "start_ampm": s_ampm,
            "end_val": e_val,
            "end_ampm": e_ampm
        },
        "start_dttm": start_dttm,
        "end_dttm": end_dttm
    }

def get_rate_data(
    vehicle_type: Literal['light'],
    departure_time: datetime,
    direction: Literal['east', 'west'],
    trip_duration_seconds: float
) -> tuple[pd.DataFrame, list[TimeRangeParsed]]:
    
    assert vehicle_type == 'light'
    is_weekday = departure_time.weekday() < 5
    day_type: Literal['weekday', 'weekend'] = 'weekday' if is_weekday else 'weekend'
    
    CSV_DIR: Path = LIGHTWEIGHT_RATES_DIR
    csv_file_name = f'{day_type}_{direction}bound_rates.csv'
    csv = pd.read_csv(CSV_DIR / csv_file_name)

    time_range_data: list[TimeRangeParsed] = []
    for col_idx, column in enumerate(csv.columns):
        time_data = parse_time_range(column, departure_time)
        if time_data is not None:
            time_data['id'] = col_idx
            if time_data['end_dttm'] < time_data['start_dttm']: # e.g. 9 pm to 5 am
                time_data_copy: TimeRangeParsed = {key: val for key, val in time_data.items()} # type: ignore
                time_data_copy['end_dttm'] = time_data_copy['end_dttm'].replace(hour=0, minute=0) - timedelta(microseconds=1) + timedelta(days=1)
                time_range_data.append(time_data_copy)

                time_data['start_dttm'] = time_data['start_dttm'].replace(hour=0, minute=0)
            time_range_data.append(time_data)

    time_range_data.sort(key=lambda val: val['start_dttm'])
    return csv, time_range_data

def validate_starting_ending_interchanges(
        direction: Literal['east', 'west'],
        starting_interchange: str,
        ending_interchange: str
    ):
    interchanges_lst = [interchange['name'] for interchange in HWY_407_INTERCHANGES]
    interchanges_set = set(interchanges_lst)
    if starting_interchange not in interchanges_set or ending_interchange not in interchanges_set:
        raise ValueError(f'Invalid starting/ending interchange {starting_interchange=} {ending_interchange=}')

    if interchanges_lst.index(starting_interchange) > interchanges_lst.index(ending_interchange) and direction != 'west':
        raise ValueError(f'Invalid direction "{direction}" for the starting/ending interchange {starting_interchange=} {ending_interchange=}')

    if interchanges_lst.index(starting_interchange) < interchanges_lst.index(ending_interchange) and direction != 'east':
        raise ValueError(f'Invalid direction "{direction}" for the starting/ending interchange {starting_interchange=} {ending_interchange=}')

    if starting_interchange == ending_interchange:
        raise ValueError(f'Same starting/ending interchange {starting_interchange=} {ending_interchange=}')

# Prerequisite: departure_time is in Toronto time
# TODO: test
def get_toll_cost(
    vehicle_type: Literal['light'],
    departure_time: datetime,
    direction: Literal['east', 'west'],
    starting_interchange: str,
    ending_interchange: str,
    trip_duration_seconds: float
):
    # TODO: Change this function to pass in duration per interchange, rather than total duration, and possibly distance per interchange
    rate_df, time_range_data = get_rate_data(vehicle_type, departure_time, direction, trip_duration_seconds)
    validate_starting_ending_interchanges(direction, starting_interchange, ending_interchange)
    
    if direction == 'west':
        starting_interchange, ending_interchange = ending_interchange, starting_interchange

    elif direction != 'east':
        raise ValueError(f'Invalid direction: {direction}')
    
    start_counting = False
    trip_interchanges: list[dict] = []
    for i, interchange in enumerate(HWY_407_INTERCHANGES):

        if interchange['name'] == starting_interchange:
            start_counting = True

        if interchange['name'] == ending_interchange:
            break

        if start_counting:
            distance = HWY_407_INTERCHANGES[i + 1]['ref'] - interchange['ref']
            trip_interchanges.append({
                'distance': distance,
                'zone': interchange['zone'],
                'portion_start_interchange': interchange['name'],
                'portion_end_interchange': HWY_407_INTERCHANGES[i + 1]['name']
            })

    total_distance = float(sum(trip_portion['distance'] for trip_portion in trip_interchanges))
    total_cost = 0.0
    time_elapsed = 0.0
    toronto_tz = ZoneInfo("America/Toronto")
    local_ref = departure_time.astimezone(toronto_tz)
    cost_per_interchange: list[CostPerInterchange] = []
    for trip_portion in trip_interchanges:
        distance_in_interchange = trip_portion['distance']
        zone = trip_portion['zone']
        portion_start_interchange = trip_portion['portion_start_interchange']
        portion_end_interchange = trip_portion['portion_end_interchange']

        distance_proportion = distance_in_interchange / total_distance
        time_in_interchange = distance_proportion * trip_duration_seconds
        rate_in_zone = rate_df[rate_df['Zone'] == zone]

        remaining_time = time_in_interchange
        cost_in_interchange = 0.0
        for time_range in time_range_data:
            if remaining_time <= 0:
                break

            idx = time_range['id']
            rate = float(rate_in_zone.iat[0, idx]) # type: ignore

            start_time = time_range['start_dttm']
            end_time = time_range['end_dttm']

            cur_time = local_ref
            cur_time = cur_time + timedelta(seconds=time_elapsed + (time_in_interchange - remaining_time))
            if cur_time.date() > local_ref.date():
                cur_time -= timedelta(days=1)
            
            if not (start_time <= cur_time <= end_time):
                continue

            duration_in_time_range = min(remaining_time, (end_time - cur_time).total_seconds())
            remaining_time -= duration_in_time_range
            cost_in_interchange += distance_in_interchange * rate * duration_in_time_range / time_in_interchange
        total_cost += cost_in_interchange
        cost_per_interchange.append({
            'portion_start_interchange': portion_start_interchange,
            'portion_end_interchange': portion_end_interchange,
            'cost_in_portion': cost_in_interchange
        })

        time_elapsed += time_in_interchange
    
    return total_cost, cost_per_interchange

