from typing import Dict, List, Any

DEFAULT_SCHEDULING_CONFIG: Dict[str, Any] = {
    "north_days": ["Monday", "Tuesday", "Wednesday"],
    "south_days": ["Thursday", "Friday"],
    "kushavati_days": ["Saturday"],
    "urgent_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "max_daily_slots": 15
}

_active_scheduling_config: Dict[str, Any] = dict(DEFAULT_SCHEDULING_CONFIG)

DAY_NAME_TO_JS_WEEKDAY = {
    "Sunday": 0,
    "Monday": 1,
    "Tuesday": 2,
    "Wednesday": 3,
    "Thursday": 4,
    "Friday": 5,
    "Saturday": 6
}

def get_active_scheduling_config() -> Dict[str, Any]:
    return dict(_active_scheduling_config)

def update_active_scheduling_config(new_config: Dict[str, Any]) -> Dict[str, Any]:
    global _active_scheduling_config
    if "north_days" in new_config:
        _active_scheduling_config["north_days"] = list(new_config["north_days"])
    elif "northDays" in new_config:
        _active_scheduling_config["north_days"] = list(new_config["northDays"])

    if "south_days" in new_config:
        _active_scheduling_config["south_days"] = list(new_config["south_days"])
    elif "southDays" in new_config:
        _active_scheduling_config["south_days"] = list(new_config["southDays"])

    if "kushavati_days" in new_config:
        _active_scheduling_config["kushavati_days"] = list(new_config["kushavati_days"])
    elif "kushavatiDays" in new_config:
        _active_scheduling_config["kushavati_days"] = list(new_config["kushavatiDays"])

    if "max_daily_slots" in new_config:
        _active_scheduling_config["max_daily_slots"] = int(new_config["max_daily_slots"])
    elif "maxDailyBookings" in new_config:
        _active_scheduling_config["max_daily_slots"] = int(new_config["maxDailyBookings"])

    return dict(_active_scheduling_config)
