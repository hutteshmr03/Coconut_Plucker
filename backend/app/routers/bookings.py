import base64
import hashlib
import hmac
import json
import urllib.error
import urllib.request
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload
from app.core.config import settings
from app.core.database import get_db
from app.core.audit import record_audit_log
from app.core.email import send_booking_notification_email, send_test_email
from app.models.booking import Booking
from app.models.service import Service
from app.models.user import User
from app.models.payment import Payment
from app.routers.auth import require_user, require_admin_user
from app.schemas.booking import QuoteRequest, QuoteResponse, BookingCreate, BookingOut, BookingServiceItem

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def _lookup_service(db: Session, service_id: Optional[str], service_name: Optional[str]) -> Service:
    active_filter = or_(Service.status != "inactive", Service.status.is_(None))
    svc = None
    if service_id:
        try:
            sid = uuid.UUID(str(service_id))
            svc = db.query(Service).filter(Service.id == sid, active_filter).first()
        except Exception:
            svc = None

    if not svc and service_name:
        clean_name = service_name.strip()
        if clean_name:
            svc = (
                db.query(Service)
                .filter(func.lower(Service.name) == clean_name.lower(), active_filter)
                .first()
            )
            if not svc:
                matches = (
                    db.query(Service)
                    .filter(Service.name.ilike(f"%{clean_name[:24]}%"), active_filter)
                    .limit(2)
                    .all()
                )
                if len(matches) == 1:
                    svc = matches[0]

    if not svc:
        raise HTTPException(
            status_code=404,
            detail=f"Selected service not found or inactive: {service_name or service_id or 'unknown'}",
        )
    return svc


def _resolve_service_and_quote(
    db: Session,
    service_id: Optional[str],
    service_name: Optional[str],
    tree_count: int,
    booking_type: str,
    services: Optional[List[BookingServiceItem]] = None,
):
    if services:
        base_amount = 0.0
        total_trees = 0
        resolved_names = []
        primary_svc = None
        for item in services:
            item_sid = item.service_id or item.serviceId
            item_sname = item.service_name or item.serviceName
            item_qty = max(int(item.tree_count or item.treeCount or 1), 1)
            item_svc = _lookup_service(db, item_sid, item_sname)
            if primary_svc is None:
                primary_svc = item_svc
            base_amount += float(item_svc.base_rate) * item_qty
            total_trees += item_qty
            resolved_names.append(item_svc.name)
        combined_name = " + ".join(resolved_names)
    else:
        primary_svc = _lookup_service(db, service_id, service_name)
        total_trees = max(int(tree_count or 1), 1)
        base_amount = float(primary_svc.base_rate) * total_trees
        combined_name = primary_svc.name

    base_amount = round(base_amount, 2)
    is_urgent = (booking_type or "standard").strip().lower() == "urgent"
    surcharge_rate = 0.20 if is_urgent else 0.0
    surcharge_label = "Urgent / Same-Day Dispatch (+20%)" if is_urgent else None
    surcharge_amount = round(base_amount * surcharge_rate, 2)
    quote_amount = round(base_amount + surcharge_amount, 2)
    return primary_svc, combined_name, total_trees, base_amount, surcharge_rate, surcharge_label, surcharge_amount, quote_amount


def _verify_razorpay_signature(order_id: str, payment_id: str, signature: str, secret: str) -> bool:
    if not (order_id and payment_id and signature and secret):
        return False
    expected = hmac.new(
        secret.encode("utf-8"),
        f"{order_id}|{payment_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


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
        payment_status="paid" if (b.payment and b.payment.status == "success") else (b.payment.status if b.payment else "pending"),
        hazard_notes=b.hazard_notes,
        tree_photo=b.tree_photo,
        urgent_call_confirmed=bool(call_ok),
        created_at=b.created_at.isoformat() if b.created_at else datetime.now().isoformat()
    )


@router.post("/quote", response_model=QuoteResponse)
def calculate_quote(req: QuoteRequest, db: Session = Depends(get_db)):
    _, _, _, base_amount, surcharge_rate, surcharge_label, surcharge_amount, quote_amount = _resolve_service_and_quote(
        db,
        req.service_id,
        req.service_name,
        req.tree_count,
        req.booking_type,
        req.services,
    )

    return QuoteResponse(
        base_amount=base_amount,
        surcharge_rate=surcharge_rate,
        surcharge_label=surcharge_label,
        surcharge_amount=surcharge_amount,
        gst_rate=0.0,
        gst_amount=0.0,
        quote_amount=quote_amount,
    )


@router.post("/razorpay/order")
def create_razorpay_order(
    req: QuoteRequest,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    _, combined_name, _, _, _, _, _, quote_amount = _resolve_service_and_quote(
        db,
        req.service_id,
        req.service_name,
        req.tree_count,
        req.booking_type,
        req.services,
    )
    amount_paise = int(round(quote_amount * 100))

    if settings.RAZORPAY_KEY_ID.strip() and settings.RAZORPAY_KEY_SECRET.strip():
        payload = json.dumps({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"rcpt_{uuid.uuid4().hex[:12]}",
            "payment_capture": 1,
            "notes": {"service": combined_name[:200], "user_id": str(current_user.id)},
        }).encode("utf-8")
        creds = base64.b64encode(
            f"{settings.RAZORPAY_KEY_ID.strip()}:{settings.RAZORPAY_KEY_SECRET.strip()}".encode("utf-8")
        ).decode("ascii")
        http_req = urllib.request.Request(
            "https://api.razorpay.com/v1/orders",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Basic {creds}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(http_req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            raise HTTPException(status_code=502, detail=f"Razorpay order creation failed ({e.code}): {err_body[:160]}")
        except Exception:
            raise HTTPException(status_code=502, detail="Unable to connect to Razorpay to initiate payment")

        return {
            "mode": "razorpay",
            "order_id": data.get("id"),
            "amount_paise": data.get("amount", amount_paise),
            "currency": data.get("currency", "INR"),
            "key_id": settings.RAZORPAY_KEY_ID.strip(),
            "quote_amount": quote_amount,
        }

    if settings.ENVIRONMENT.strip().lower() == "production":
        raise HTTPException(
            status_code=503,
            detail="Razorpay server secret is not configured. Payment cannot be initialized securely.",
        )

    return {
        "mode": "dev_simulated",
        "order_id": None,
        "amount_paise": amount_paise,
        "currency": "INR",
        "key_id": settings.RAZORPAY_KEY_ID.strip(),
        "quote_amount": quote_amount,
    }


@router.get("", response_model=List[BookingOut])
def get_my_bookings(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    query = db.query(Booking).options(joinedload(Booking.service), joinedload(Booking.payment))
    if current_user.role == "customer":
        query = query.filter(Booking.customer_id == current_user.id)
    elif current_user.role == "professional":
        query = query.filter(Booking.professional_id == current_user.id)
    elif current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Unauthorized role")
    bookings = query.order_by(Booking.created_at.desc()).all()
    return [_format_booking(b) for b in bookings]


@router.post("", response_model=BookingOut)
def create_booking(
    req: BookingCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    # Parse scheduled date
    try:
        scheduled_dt = datetime.fromisoformat(req.scheduled_at.replace("Z", "+00:00"))
    except Exception:
        scheduled_dt = datetime.now()

    svc, resolved_names, total_trees, _, _, _, _, quote_amt = _resolve_service_and_quote(
        db,
        req.service_id,
        req.service_name,
        req.tree_count,
        req.booking_type,
        req.services,
    )
    is_urgent = (req.booking_type or "standard").strip().lower() == "urgent"

    # Resolve customer strictly via authenticated user (or explicit target if admin)
    if current_user.role == "customer":
        customer = current_user
    elif current_user.role in ("admin", "super_admin"):
        customer = None
        if req.customer_id:
            try:
                cid = uuid.UUID(req.customer_id)
                customer = db.query(User).filter(User.id == cid).first()
            except Exception:
                customer = None
        if not customer and req.customer_phone:
            raw_digits = "".join(filter(str.isdigit, req.customer_phone))
            p_clean = raw_digits[-10:] if len(raw_digits) >= 10 else raw_digits
            if p_clean:
                customer = db.query(User).filter(User.phone == p_clean).first()
        if not customer:
            raise HTTPException(status_code=400, detail="Valid customer_id or customer_phone is required")
    else:
        raise HTTPException(status_code=403, detail="Only customers or administrators can place bookings")

    # Verify payment server-side whenever Razorpay secret is configured or payment signature fields are supplied
    rzp_secret = settings.RAZORPAY_KEY_SECRET.strip()
    is_prod = settings.ENVIRONMENT.strip().lower() == "production"
    has_rzp_fields = bool(req.razorpay_order_id or req.razorpay_payment_id or req.razorpay_signature)

    if rzp_secret:
        if not (req.razorpay_order_id and req.razorpay_payment_id and req.razorpay_signature):
            raise HTTPException(status_code=400, detail="Payment verification required: missing Razorpay transaction fields")
        if not _verify_razorpay_signature(req.razorpay_order_id, req.razorpay_payment_id, req.razorpay_signature, rzp_secret):
            raise HTTPException(status_code=400, detail="Razorpay payment signature verification failed")
        payment_status_db = "success"
        email_payment_status = "Paid (Verified)"
    elif has_rzp_fields:
        raise HTTPException(status_code=503, detail="Payment signature cannot be verified without server Razorpay secret")
    elif is_prod:
        raise HTTPException(status_code=503, detail="Payment verification is unavailable because RAZORPAY_KEY_SECRET is not configured")
    else:
        payment_status_db = "pending"
        email_payment_status = "Pending Verification (Dev Mode)"

    svc_name = req.service_name or resolved_names
    order_id = req.booking_number or f"CP-{str(uuid.uuid4())[:6].upper()}"

    booking = Booking(
        booking_number=order_id,
        customer_id=customer.id,
        service_id=svc.id,
        service_name=svc_name,
        tree_count=total_trees,
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

    payment = Payment(
        booking_id=booking.id,
        amount=quote_amt,
        payment_method=(req.payment_method or "UPI").upper(),
        status=payment_status_db,
    )
    db.add(payment)

    db.commit()
    db.refresh(booking)

    order_id = booking.booking_number or f"CP-{str(booking.id)[:8].upper()}"
    cust_name = req.customer_name or customer.full_name or "Customer"
    cust_phone = req.customer_phone or customer.phone or "N/A"
    scheduled_display = scheduled_dt.strftime("%d %b %Y, %I:%M %p")

    notification_payload = {
        "order_id": order_id,
        "booking_id": str(booking.id),
        "customer_name": cust_name,
        "customer_phone": cust_phone,
        "service_name": svc_name,
        "tree_count": total_trees,
        "height_category": booking.height_category or "Standard",
        "taluka": req.taluka,
        "address": req.address,
        "scheduled_at": scheduled_display,
        "booking_type": req.booking_type,
        "quote_amount": float(booking.quote_amount),
        "payment_method": (req.payment_method or "UPI").upper(),
        "payment_status": email_payment_status,
        "hazard_notes": req.hazard_notes or "",
        "created_at": datetime.now().strftime("%d %b %Y, %I:%M %p")
    }

    background_tasks.add_task(send_booking_notification_email, notification_payload)

    record_audit_log(
        db,
        actor=f"{cust_name} ({cust_phone})",
        action="Placed Customer Booking",
        target=f"Booking #{order_id}",
        details=f"{svc_name} · {total_trees} trees · {req.taluka} · ₹{float(booking.quote_amount):.2f}"
    )

    return _format_booking(booking)


@router.api_route("/test-email", methods=["GET", "POST"], dependencies=[Depends(require_admin_user)])
def trigger_test_email(to: Optional[str] = None):
    """Admin-only utility endpoint to verify email delivery to contact@paddeli.com."""
    res = send_test_email(to)
    return res


@router.post("/notify-email", dependencies=[Depends(require_admin_user)])
def trigger_booking_notification(data: dict, background_tasks: BackgroundTasks):
    """Admin-only manual dispatch of booking notification email."""
    background_tasks.add_task(send_booking_notification_email, data)
    return {"success": True, "message": "Booking notification email queued for delivery"}


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking_detail(
    booking_id: str,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    try:
        bid = uuid.UUID(booking_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = (
        db.query(Booking)
        .options(joinedload(Booking.service), joinedload(Booking.payment))
        .filter(Booking.id == bid)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    is_admin = current_user.role in ("admin", "super_admin")
    is_owner = booking.customer_id == current_user.id or booking.professional_id == current_user.id
    if not (is_admin or is_owner):
        raise HTTPException(status_code=403, detail="Not authorized to view this booking")

    return _format_booking(booking)


@router.post("/{booking_id}/payment")
def pay_booking(
    booking_id: str,
    data: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    try:
        bid = uuid.UUID(booking_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = db.query(Booking).filter(Booking.id == bid).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    is_admin = current_user.role in ("admin", "super_admin")
    if not is_admin and booking.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to pay for this booking")

    rzp_secret = settings.RAZORPAY_KEY_SECRET.strip()
    is_prod = settings.ENVIRONMENT.strip().lower() == "production"
    rzp_order_id = data.get("razorpay_order_id")
    rzp_payment_id = data.get("razorpay_payment_id")
    rzp_signature = data.get("razorpay_signature")

    if rzp_secret:
        if not (rzp_order_id and rzp_payment_id and rzp_signature):
            raise HTTPException(status_code=400, detail="Missing Razorpay signature verification fields")
        if not _verify_razorpay_signature(rzp_order_id, rzp_payment_id, rzp_signature, rzp_secret):
            raise HTTPException(status_code=400, detail="Invalid Razorpay payment signature")
        payment_status = "success"
    elif is_prod:
        raise HTTPException(status_code=503, detail="Razorpay secret not configured for payment verification")
    else:
        payment_status = "pending"

    amount = float(booking.quote_amount or 0.0)
    payment = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    if payment:
        payment.amount = amount
        payment.payment_method = (data.get("payment_method") or payment.payment_method or "UPI").upper()
        payment.status = payment_status
    else:
        payment = Payment(
            booking_id=booking.id,
            amount=amount,
            payment_method=(data.get("payment_method") or "UPI").upper(),
            status=payment_status,
        )
        db.add(payment)

    db.commit()
    return {
        "success": True,
        "payment_id": str(payment.id),
        "status": "paid" if payment_status == "success" else payment_status,
        "message": "Payment recorded successfully"
    }


@router.post("/{booking_id}/review")
def review_booking(
    booking_id: str,
    data: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    try:
        bid = uuid.UUID(booking_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = db.query(Booking).filter(Booking.id == bid).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    is_admin = current_user.role in ("admin", "super_admin")
    if not is_admin and booking.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to review this booking")

    return {
        "success": True,
        "booking_id": booking_id,
        "rating": data.get("rating", 5),
        "comment": data.get("comment", "Great service!"),
        "message": "Review submitted successfully"
    }
