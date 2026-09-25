from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class QuoteRequest(BaseModel):
    service_id: str
    tree_count: int = 1
    booking_type: str = "standard"

class QuoteResponse(BaseModel):
    base_amount: float
    surcharge_rate: float
    surcharge_label: Optional[str] = None
    surcharge_amount: float
    gst_rate: Optional[float] = 0.18
    gst_amount: Optional[float] = 0.0
    quote_amount: float

class BookingCreate(BaseModel):
    customer_id: Optional[str] = None
    service_id: str
    tree_count: int = 1
    height_category: Optional[str] = None
    taluka: str
    address: str
    scheduled_at: str
    booking_type: str = "standard"
    payment_method: Optional[str] = "UPI"

class BookingOut(BaseModel):
    id: str
    customer_id: Optional[str] = None
    professional_id: Optional[str] = None
    service_id: Optional[str] = None
    service_name: Optional[str] = None
    height_category: Optional[str] = None
    taluka: Optional[str] = None
    address: Optional[str] = None
    scheduled_at: str
    status: str
    booking_type: str = "standard"
    quote_amount: Optional[float] = None
    urgent_call_confirmed: bool = False
    created_at: str
