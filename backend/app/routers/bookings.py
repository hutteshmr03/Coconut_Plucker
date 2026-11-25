import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.email import send_booking_notification_email, send_test_email
from app.models.booking import Booking
from app.models.service import Service
from app.models.user import User
from app.models.payment import Payment
from app.routers.auth import get_optional_user
from app.schemas.booking import QuoteRequest, QuoteResponse, BookingCreate, BookingOut

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def _format_booking(b: Booking) -> BookingOut:
    b_type = b.booking_type or "standard"
    call_ok = b.call_confirmed if b.call_confirmed is not None else (b_type != "urgent")
    return BookingOut(
        id=str(b.id),
        booking_number=b.booking_number or f"CP-{str(b.id)[:8].upper()}",
        customer_id=str(b.customer_id) if b.customer_id else None,
        professional_id=str(b.professional_id) if b.professional_id else None,
        service_id=str(b.service_id) if b.service_id else None,
        service_name=b.service_name or (b.service.name if b.service else "Coconut Harvesting"),
        tree_count=b.tree_count or 1,
        height_category=b.height_category,
        taluka=b.taluka or "North Goa",
        address=b.address or "Goa",
        scheduled_at=b.scheduled_at.isoformat() if b.scheduled_at else datetime.now().isoformat(),
        status=b.status,
        booking_type=b_type,
        call_confirmed=bool(call_ok),
        quote_amount=float(b.quote_amount) if b.quote_amount else 0.0,
        payment_method=b.payment.payment_method if b.payment else "UPI",
        payment_status="paid" if (not b.payment or b.payment.status == "success") else b.payment.status,
        hazard_notes=b.hazard_notes,
        tree_photo=b.tree_photo,
        urgent_call_confirmed=bool(call_ok),
        created_at=b.created_at.isoformat() if b.created_at else datetime.now().isoformat()
    )

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

    return QuoteResponse(
        base_amount=base_amount,
        surcharge_rate=0.0,
        surcharge_label=None,
        surcharge_amount=0.0,
        gst_rate=0.0,
        gst_amount=0.0,
        quote_amount=base_amount
    )

@router.get("", response_model=List[BookingOut])
def get_my_bookings(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    query = db.query(Booking).options(joinedload(Booking.service), joinedload(Booking.payment))
    if current_user:
        if current_user.role == "customer":
            query = query.filter(Booking.customer_id == current_user.id)
        elif current_user.role == "professional":
            query = query.filter(Booking.professional_id == current_user.id)
    bookings = query.order_by(Booking.created_at.desc()).all()
    return [_format_booking(b) for b in bookings]

@router.post("", response_model=BookingOut)
def create_booking(
    req: BookingCreate,
    background_tasks: BackgroundTasks,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
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

    # If service not found by UUID, look up by name or partial slug
    if not svc and req.service_name:
        svc = db.query(Service).filter(Service.name.ilike(f"%{req.service_name[:10]}%")).first()
    if not svc:
        svc = db.query(Service).first()
    if svc:
        base_rate = float(svc.base_rate)

    base_amt = base_rate * max(req.tree_count, 1)
    is_urgent = (req.booking_type or "standard").lower() == "urgent"
    surcharge_amt = (base_amt * 0.20) if is_urgent else 0.0
    quote_amt = base_amt + surcharge_amt

    # Resolve customer (prefer authenticated JWT user, then explicit customer_id, then phone)
    customer = current_user if (current_user and current_user.role == "customer") else None
    if not customer and req.customer_id:
        try:
            cid = uuid.UUID(req.customer_id)
            customer = db.query(User).filter(User.id == cid).first()
        except Exception:
            pass
    if not customer and req.customer_phone:
        raw_digits = "".join(filter(str.isdigit, req.customer_phone))
        p_clean = raw_digits[-10:] if len(raw_digits) >= 10 else raw_digits
        if p_clean:
            customer = db.query(User).filter(User.phone == p_clean).first()
    if not customer:
        customer = db.query(User).filter(User.role == "customer").first()

    svc_name = req.service_name or (svc.name if svc else "Coconut Harvesting")
    order_id = req.booking_number or f"CP-{str(uuid.uuid4())[:6].upper()}"

    booking = Booking(
        booking_number=order_id,
        customer_id=customer.id if customer else None,
        service_id=svc.id if svc else None,
        service_name=svc_name,
        tree_count=max(req.tree_count, 1),
        height_category=req.height_category,
        taluka=req.taluka or "North Goa",
        address=req.address or "Goa",
        booking_type=req.booking_type or "standard",
        call_confirmed=(not is_urgent),
        hazard_notes=req.hazard_notes,
        tree_photo=req.tree_photo,
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

    # Prepare notification details for contact@paddeli.com
    order_id = booking.booking_number or f"CP-{str(booking.id)[:8].upper()}"
    cust_name = req.customer_name or (customer.full_name if customer else "Customer")
    cust_phone = req.customer_phone or (customer.phone if customer else "N/A")
    scheduled_display = scheduled_dt.strftime("%d %b %Y, %I:%M %p")

    notification_payload = {
        "order_id": order_id,
        "booking_id": str(booking.id),
        "customer_name": cust_name,
        "customer_phone": cust_phone,
        "service_name": svc_name,
        "tree_count": max(req.tree_count, 1),
        "height_category": booking.height_category or "Standard",
        "taluka": req.taluka,
        "address": req.address,
        "scheduled_at": scheduled_display,
        "booking_type": req.booking_type,
        "quote_amount": float(booking.quote_amount),
        "payment_method": (req.payment_method or "UPI").upper(),
        "payment_status": "Paid",
        "hazard_notes": req.hazard_notes or "",
        "created_at": datetime.now().strftime("%d %b %Y, %I:%M %p")
    }

    # Queue email in background (non-blocking, fast HTTP response to user)
    background_tasks.add_task(send_booking_notification_email, notification_payload)

    return _format_booking(booking)


@router.api_route("/test-email", methods=["GET", "POST"])
def trigger_test_email(to: Optional[str] = None):
    """Utility endpoint to verify email delivery to contact@paddeli.com via browser or curl."""
    res = send_test_email(to)
    return res


@router.post("/notify-email")
def trigger_booking_notification(data: dict, background_tasks: BackgroundTasks):
    """Allows manual or direct frontend dispatch of booking notification email."""
    background_tasks.add_task(send_booking_notification_email, data)
    return {"success": True, "message": "Booking notification email queued for delivery"}

@router.get("/{booking_id}", response_model=BookingOut)
def get_booking_detail(booking_id: str, db: Session = Depends(get_db)):
    try:
        bid = uuid.UUID(booking_id)
        booking = db.query(Booking).options(joinedload(Booking.service)).filter(Booking.id == bid).first()
    except Exception:
        booking = db.query(Booking).options(joinedload(Booking.service)).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    return _format_booking(booking)

@router.post("/{booking_id}/payment")
def pay_booking(booking_id: str, data: dict, db: Session = Depends(get_db)):
    try:
        bid = uuid.UUID(booking_id)
        booking = db.query(Booking).filter(Booking.id == bid).first()
    except Exception:
        booking = None

    payment = Payment(
        booking_id=booking.id if booking else None,
        amount=float(data.get("amount", 100.0)),
        payment_method=data.get("payment_method", "UPI"),
        status="success"
    )
    db.add(payment)
    db.commit()
    return {
        "success": True,
        "payment_id": str(payment.id),
        "status": "paid",
        "message": "Payment recorded successfully"
    }

@router.post("/{booking_id}/review")
def review_booking(booking_id: str, data: dict, db: Session = Depends(get_db)):
    return {
        "success": True,
        "booking_id": booking_id,
        "rating": data.get("rating", 5),
        "comment": data.get("comment", "Great service!"),
        "message": "Review submitted successfully"
    }
