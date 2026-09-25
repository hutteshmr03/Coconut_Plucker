import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.booking import Booking
from app.models.service import Service
from app.models.user import User
from app.models.payment import Payment
from app.schemas.booking import QuoteRequest, QuoteResponse, BookingCreate, BookingOut

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.post("/quote", response_model=QuoteResponse)
def calculate_quote(req: QuoteRequest, db: Session = Depends(get_db)):
    base_rate = 100.0
    try:
        sid = uuid.UUID(req.service_id)
        svc = db.query(Service).filter(Service.id == sid).first()
        if svc:
            base_rate = float(svc.base_rate)
    except Exception:
        pass

    base_amount = base_rate * max(req.tree_count, 1)
    is_urgent = req.booking_type == "urgent"
    
    # User requirement: Only 20% GST for urgent bookings (no separate surcharge)
    gst_rate = 0.20 if is_urgent else 0.18
    gst_label = "20% Urgent GST" if is_urgent else "18% GST"
    gst_amount = round(base_amount * gst_rate, 2)
    total_quote = round(base_amount + gst_amount, 2)

    return QuoteResponse(
        base_amount=base_amount,
        surcharge_rate=0.0,
        surcharge_label=gst_label,
        surcharge_amount=0.0,
        gst_rate=gst_rate,
        gst_amount=gst_amount,
        quote_amount=total_quote
    )

@router.get("", response_model=List[BookingOut])
def get_my_bookings(db: Session = Depends(get_db)):
    bookings = db.query(Booking).all()
    results = []
    for b in bookings:
        results.append(
            BookingOut(
                id=str(b.id),
                customer_id=str(b.customer_id) if b.customer_id else None,
                professional_id=str(b.professional_id) if b.professional_id else None,
                service_id=str(b.service_id) if b.service_id else None,
                service_name=b.service.name if b.service else "Service",
                height_category=b.height_category,
                taluka="North Goa",
                address="Goa",
                scheduled_at=b.scheduled_at.isoformat() if b.scheduled_at else datetime.now().isoformat(),
                status=b.status,
                booking_type="urgent" if b.status == "urgent" else "standard",
                quote_amount=float(b.quote_amount) if b.quote_amount else 0.0,
                urgent_call_confirmed=True,
                created_at=b.created_at.isoformat() if b.created_at else datetime.now().isoformat()
            )
        )
    return results

@router.post("", response_model=BookingOut)
def create_booking(req: BookingCreate, db: Session = Depends(get_db)):
    # Parse scheduled date
    try:
        scheduled_dt = datetime.fromisoformat(req.scheduled_at.replace("Z", "+00:00"))
    except Exception:
        scheduled_dt = datetime.now()

    # Calculate quote
    base_rate = 100.0
    svc = None
    try:
        sid = uuid.UUID(req.service_id)
        svc = db.query(Service).filter(Service.id == sid).first()
        if svc:
            base_rate = float(svc.base_rate)
    except Exception:
        pass

    base_amt = base_rate * max(req.tree_count, 1)
    is_urgent = req.booking_type == "urgent"
    surcharge = round(base_amt * 0.20, 2) if is_urgent else 0.0
    quote_amt = base_amt + surcharge

    # Resolve customer
    customer = None
    if req.customer_id:
        try:
            cid = uuid.UUID(req.customer_id)
            customer = db.query(User).filter(User.id == cid).first()
        except Exception:
            pass
    if not customer:
        customer = db.query(User).filter(User.role == "customer").first()

    booking = Booking(
        customer_id=customer.id if customer else None,
        service_id=svc.id if svc else None,
        height_category=req.height_category,
        scheduled_at=scheduled_dt,
        status="requested",
        quote_amount=quote_amt
    )
    db.add(booking)
    db.flush()

    # Record payment
    payment = Payment(
        booking_id=booking.id,
        amount=quote_amt,
        payment_method=(req.payment_method or "UPI").upper(),
        status="success"
    )
    db.add(payment)

    db.commit()
    db.refresh(booking)

    return BookingOut(
        id=str(booking.id),
        customer_id=str(booking.customer_id) if booking.customer_id else None,
        service_id=str(booking.service_id) if booking.service_id else None,
        service_name=svc.name if svc else "Coconut Harvesting",
        height_category=booking.height_category,
        taluka=req.taluka,
        address=req.address,
        scheduled_at=booking.scheduled_at.isoformat(),
        status=booking.status,
        booking_type=req.booking_type,
        quote_amount=float(booking.quote_amount),
        urgent_call_confirmed=False,
        created_at=booking.created_at.isoformat()
    )
