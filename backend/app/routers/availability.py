from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/availability", tags=["Availability"])

class TimeSlot(BaseModel):
    value: str
    label: str

class AvailableDate(BaseModel):
    date: str
    day_name: str
    label: str
    time_slots: List[TimeSlot]

class AvailabilityResponse(BaseModel):
    taluka: str
    service_id: Optional[str] = None
    booking_type: str = "standard"
    allowed_days: List[str]
    available_dates: List[AvailableDate]
    next_available_date: Optional[str] = None
    message: str

from app.core.scheduling_state import get_active_scheduling_config, DAY_NAME_TO_JS_WEEKDAY

@router.get("", response_model=AvailabilityResponse)
def get_availability(
    taluka: str = "North Goa",
    service_id: Optional[str] = None,
    booking_type: str = "standard",
    north_days: Optional[str] = None,
    south_days: Optional[str] = None,
    kushavati_days: Optional[str] = None,
):
    is_urgent = booking_type == "urgent"
    clean_taluka = (taluka or "").lower()
    is_north = "north" in clean_taluka
    is_kushavati = "kushavati" in clean_taluka

    cfg = get_active_scheduling_config()

    if is_urgent:
        allowed_day_names = cfg.get("urgent_days", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"])
    elif is_north:
        if north_days:
            allowed_day_names = [d.strip() for d in north_days.split(",") if d.strip()]
        else:
            allowed_day_names = cfg.get("north_days", ["Monday", "Tuesday", "Wednesday"])
    elif is_kushavati:
        if kushavati_days:
            allowed_day_names = [d.strip() for d in kushavati_days.split(",") if d.strip()]
        else:
            allowed_day_names = cfg.get("kushavati_days", ["Saturday"])
    else:
        # South Goa
        if south_days:
            allowed_day_names = [d.strip() for d in south_days.split(",") if d.strip()]
        else:
            allowed_day_names = cfg.get("south_days", ["Thursday", "Friday"])

    allowed_days = [
        DAY_NAME_TO_JS_WEEKDAY[d]
        for d in allowed_day_names
        if d in DAY_NAME_TO_JS_WEEKDAY
    ]
    if not allowed_days:
        allowed_days = [4, 5]
        allowed_day_names = ["Thursday", "Friday"]

    day_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    available_dates = []
    today = datetime.now()

    for i in range(1, 15):
        candidate = today + timedelta(days=i)
        # Map: Sunday=0, Mon=1, ..., Sat=6
        js_day = (candidate.weekday() + 1) % 7

        if js_day in allowed_days:
            iso = candidate.strftime("%Y-%m-%d")
            day_name = day_names[js_day]
            label = f"{candidate.strftime('%d %b')} ({day_name})"
            available_dates.append(
                AvailableDate(
                    date=iso,
                    day_name=day_name,
                    label=label,
                    time_slots=[
                        TimeSlot(value="08:00", label="08:00 AM – 10:00 AM"),
                        TimeSlot(value="10:00", label="10:00 AM – 12:00 PM"),
                        TimeSlot(value="14:00", label="02:00 PM – 04:00 PM"),
                        TimeSlot(value="16:00", label="04:00 PM – 06:00 PM"),
                    ]
                )
            )

    next_avail = available_dates[0] if available_dates else None
    if is_urgent:
        msg = f"⚡ Urgent Priority: Next available dispatch is {next_avail.day_name}, {next_avail.date} (Monday to Saturday available)." if next_avail else "No available dates."
    else:
        msg = f"Next available day for {taluka} is {next_avail.day_name}, {next_avail.date}." if next_avail else f"No service days available for {taluka}."

    return AvailabilityResponse(
        taluka=taluka,
        service_id=service_id,
        booking_type=booking_type,
        allowed_days=allowed_day_names,
        available_dates=available_dates,
        next_available_date=next_avail.date if next_avail else None,
        message=msg
    )
