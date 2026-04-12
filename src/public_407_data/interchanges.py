from typing import TypedDict, List, Dict


# 1. Create the Typed Dictionary
class Interchange(TypedDict):
    # The name of the interchange
    name: str
    # The reference number for the interchange
    #   represents the number of kilometers from the start of the 407
    ref: float
    # The zone number of the interchange
    zone: int


# 2. Explicitly define HWY_407_INTERCHANGES
HWY_407_INTERCHANGES: List[Interchange] = [
    {
        "ref": 0.0,
        "name": "QEW / Hwy 403",
        "zone": 1
    },
    {
        "ref": 4.8,
        "name": "Dundas St",
        "zone": 2
    },
    {
        "ref": 9.0,
        "name": "Appleby Line",
        "zone": 2
    },
    {
        "ref": 12.8,
        "name": "Bronte Rd",
        "zone": 2
    },
    {
        "ref": 18.1,
        "name": "Neyagawa Blvd",
        "zone": 3
    },
    {
        "ref": 21.2,
        "name": "Trafalgar Rd",
        "zone": 3
    },
    {
        "ref": 23.8,
        "name": "Highway 403",
        "zone": 4
    },
    {
        "ref": 28.3,
        "name": "Britannia Rd",
        "zone": 4
    },
    {
        "ref": 31.5,
        "name": "Derry Rd",
        "zone": 4
    },
    {
        "ref": 34.2,
        "name": "Highway 401",
        "zone": 5
    },
    {
        "ref": 39.2,
        "name": "Mississauga Rd",
        "zone": 5
    },
    {
        "ref": 42.1,
        "name": "Mavis Rd",
        "zone": 5
    },
    {
        "ref": 44.1,
        "name": "Hurontario St",
        "zone": 5
    },
    {
        "ref": 46.2,
        "name": "Highway 410",
        "zone": 6
    },
    {
        "ref": 48.3,
        "name": "Dixie Rd",
        "zone": 6
    },
    {
        "ref": 50.4,
        "name": "Bramalea Rd",
        "zone": 6
    },
    {
        "ref": 53.1,
        "name": "Airport Rd",
        "zone": 6
    },
    {
        "ref": 54.2,
        "name": "Goreway Dr",
        "zone": 6
    },
    {
        "ref": 57.9,
        "name": "Highway 427",
        "zone": 7
    },
    {
        "ref": 59.4,
        "name": "Highway 27",
        "zone": 7
    },
    {
        "ref": 63.3,
        "name": "Pine Valley Dr",
        "zone": 7
    },
    {
        "ref": 65.0,
        "name": "Weston Rd",
        "zone": 7
    },
    {
        "ref": 65.8,
        "name": "Highway 400",
        "zone": 8
    },
    {
        "ref": 67.4,
        "name": "Jane St",
        "zone": 8
    },
    {
        "ref": 69.4,
        "name": "Keele St",
        "zone": 8
    },
    {
        "ref": 73.2,
        "name": "Dufferin St",
        "zone": 8
    },
    {
        "ref": 75.3,
        "name": "Bathurst St",
        "zone": 8
    },
    {
        "ref": 77.4,
        "name": "Yonge St",
        "zone": 9
    },
    {
        "ref": 79.2,
        "name": "Bayview Ave",
        "zone": 9
    },
    {
        "ref": 81.3,
        "name": "Leslie St",
        "zone": 9
    },
    {
        "ref": 83.0,
        "name": "Highway 404",
        "zone": 10
    },
    {
        "ref": 84.1,
        "name": "Woodbine Ave",
        "zone": 10
    },
    {
        "ref": 86.1,
        "name": "Warden Ave",
        "zone": 10
    },
    {
        "ref": 88.2,
        "name": "Kennedy Rd",
        "zone": 10
    },
    {
        "ref": 90.3,
        "name": "McCowan Rd",
        "zone": 11
    },
    {
        "ref": 92.2,
        "name": "Markham Rd",
        "zone": 11
    },
    {
        "ref": 94.2,
        "name": "Ninth Line",
        "zone": 11
    },
    {
        "ref": 96.3,
        "name": "Donald Cousens Pkwy",
        "zone": 11
    },
    {
        "ref": 98.4,
        "name": "York-Durham Line",
        "zone": 12
    },
    {
        "ref": 104.5,
        "name": "Whites Rd",
        "zone": 12
    },
    {
        "ref": 108.1,
        "name": "Brock Rd",
        "zone": 12
    },
]

# 3. Code to get the dictionary hwy_407_ref_to_name
hwy_407_ref_to_name: Dict[float, str] = {
    item["ref"]: item["name"] for item in HWY_407_INTERCHANGES
}

