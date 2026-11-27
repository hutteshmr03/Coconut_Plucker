from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class BookingServiceItem(BaseModel):
    service_id: Optional[str] = None
    serviceId: Optional[str] = None
    service_name: Optional[str] = None
    serviceName: Optional[str] = None
    tree_count: Optional[int] = None
    treeCount: Optional[int] = None

class QuoteRequest(BaseModel):
    service_id: Optional[str] = None
    service_name: Optional[str] = None
    tree_count: int = 1
    booking_type: str = "standard"
    services: Optional[List[BookingServiceItem]] = None

class QuoteResponse(BaseModel):
    base_amount: float
    surcharge_rate: float
    surcharge_label: Optional[str] = None
    surcharge_amount: float
    gst_rate: Optional[float] = 0.0
    gst_amount: Optional[float] = 0.0
    quote_amount: float

class BookingCreate(BaseModel):
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    service_id: Optional[str] = None
    service_name: Optional[str] = None
    services: Optional[List[BookingServiceItem]] = None
    booking_number: Optional[str] = None
    tree_count: int = 1
    height_category: Optional[str] = None
    taluka: str
    address: str
    scheduled_at: str
    booking_type: str = "standard"
    payment_method: Optional[str] = "UPI"
    payment_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    hazard_notes: Optional[str] = None
    tree_photo: Optional[str] = None

class BookingOut(BaseModel):
    id: str
    booking_number: Optional[str] = None
    customer_id: Optional[str] = None
    professional_id: Optional[str] = None
    service_id: Optional[str] = None
    service_name: Optional[str] = None
    tree_count: int = 1
    height_category: Optional[str] = None
    taluka: Optional[str] = None
    address: Optional[str] = None
    scheduled_at: str
    status: str
    booking_type: str = "standard"
    call_confirmed: bool = True
    quote_amount: Optional[float] = None
    payment_method: Optional[str] = "UPI"
    payment_status: Optional[str] = "pending"
    hazard_notes: Optional[str] = None
    tree_photo: Optional[str] = None
    urgent_call_confirmed: bool = False
    created_at: str
