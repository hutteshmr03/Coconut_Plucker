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

@router.get("", response_model=AvailabilityResponse)
def get_availability(
    taluka: str = "North Goa",
    service_id: Optional[str] = None,
    booking_type: str = "standard"
):
    is_urgent = booking_type == "urgent"
    is_north = "north" in (taluka or "").lower()

    # Urgent allows Mon(1) to Sat(6)
    # Standard North: Mon(1), Tue(2), Wed(3)
    # Standard South/Kushavati: Thu(4), Fri(5), Sat(6)
    allowed_days = [1, 2, 3, 4, 5, 6] if is_urgent else ([1, 2, 3] if is_north else [4, 5, 6])
    day_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    available_dates = []
    today = datetime.now()

    for i in range(1, 15):
        candidate = today + timedelta(days=i)
        day_of_week = candidate.weekday() + 1 # Monday is 1, Sunday is 7 in python weekday()
        # Python weekday: Mon=0 -> let's map: Sunday=0, Mon=1, ..., Sat=6
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
        allowed_days=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] if is_urgent else (["Monday", "Tuesday", "Wednesday"] if is_north else ["Thursday", "Friday", "Saturday"]),
        available_dates=available_dates,
        next_available_date=next_avail.date if next_avail else None,
        message=msg
    )
