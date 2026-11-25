import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.professional import ProfessionalProfile
from app.models.service import Service, ProfessionalSkill
from app.models.booking import Booking
from app.models.incident import Incident
from app.models.payment import Payment
from app.models.review import Review
from app.schemas.auth import UserOut
from app.routers.auth import format_user_out

security = HTTPBearer(auto_error=False)

def require_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    role = payload.get("role")
    if role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return payload

router = APIRouter(prefix="/admin", tags=["Admin Operations"], dependencies=[Depends(require_admin)])

class VerifyRequest(BaseModel):
    decision: str # 'approved' | 'rejected'
    reason: Optional[str] = None

class AssignRequest(BaseModel):
    professional_id: str

@router.get("/dashboard")
def get_admin_dashboard(db: Session = Depends(get_db)):
    total_customers = db.query(User).filter(User.role == "customer").count()
    total_professionals = db.query(User).filter(User.role == "professional").count()
    pending_verifications = db.query(User).filter(User.role == "professional", User.status == "pending_verification").count()
    total_bookings = db.query(Booking).count()
    open_incidents = db.query(Incident).filter(Incident.status == "open").count()

    return {
        "metrics": {
            "total_customers": total_customers,
            "total_professionals": total_professionals,
            "pending_verifications": pending_verifications,
            "total_bookings": total_bookings,
            "open_incidents": open_incidents
        }
    }

@router.get("/customers", response_model=List[UserOut])
def get_admin_customers(db: Session = Depends(get_db)):
    customers = (
        db.query(User)
        .options(joinedload(User.customer_profile))
        .filter(User.role == "customer")
        .all()
    )
    return [format_user_out(c, db) for c in customers]

@router.get("/professionals", response_model=List[UserOut])
def get_admin_professionals(db: Session = Depends(get_db)):
    professionals = (
        db.query(User)
        .options(
            joinedload(User.professional_profile).joinedload(ProfessionalProfile.skills)
        )
        .filter(User.role == "professional")
        .all()
    )
    return [format_user_out(p, db) for p in professionals]

@router.post("/professionals/{professional_id}/verify")
def verify_professional(professional_id: str, req: VerifyRequest, db: Session = Depends(get_db)):
    try:
        pid = uuid.UUID(professional_id)
        user = db.query(User).filter(User.id == pid, User.role == "professional").first()
    except Exception:
        user = None

    if not user:
        raise HTTPException(status_code=404, detail="Professional not found")

    user.status = "approved" if req.decision == "approved" else "rejected"
    db.commit()
    db.refresh(user)

    return {"success": True, "status": user.status, "message": f"Professional status updated to {user.status}"}

@router.post("/professionals", response_model=UserOut)
def create_professional_admin(data: dict, db: Session = Depends(get_db)):
    raw_digits = "".join(filter(str.isdigit, str(data.get("phone", ""))))
    phone_clean = raw_digits[-10:] if len(raw_digits) >= 10 else raw_digits
    if not phone_clean or len(phone_clean) < 10:
        raise HTTPException(status_code=400, detail="Valid 10-digit phone number is required.")
    exists = db.query(User).filter(User.phone == phone_clean).first()
    if exists:
        raise HTTPException(status_code=400, detail=f"An account with phone number +91 {phone_clean} already exists.")

    user = User(
        phone=phone_clean,
        full_name=(data.get("full_name") or "Professional Climber").strip(),
        role="professional",
        status=data.get("status") or "approved"
    )
    db.add(user)
    db.flush()

    prof = ProfessionalProfile(
        user_id=user.id,
        taluka=data.get("taluka") or "North Goa",
        experience_years=int(data.get("experience_years") or 1),
        safety_cert=data.get("safety_cert") or "Verified Professional Climber",
        rating_avg=float(data.get("rating_avg") or 5.0)
    )
    db.add(prof)
    db.flush()

    for sid_str in (data.get("skills") or []):
        try:
            sid = uuid.UUID(str(sid_str))
            db.add(ProfessionalSkill(professional_id=user.id, service_id=sid))
        except Exception:
            pass

    db.commit()
    db.refresh(user)
    return format_user_out(user, db)


@router.get("/bookings")
def get_all_bookings(db: Session = Depends(get_db)):
    bookings = db.query(Booking).options(
        joinedload(Booking.service),
        joinedload(Booking.customer),
        joinedload(Booking.payment)
    ).order_by(Booking.created_at.desc()).all()
    results = []
    for b in bookings:
        b_type = b.booking_type or "standard"
        call_ok = b.call_confirmed if b.call_confirmed is not None else (b_type != "urgent")
        results.append({
            "id": str(b.id),
            "booking_number": b.booking_number or f"CP-{str(b.id)[:8].upper()}",
            "customer_id": str(b.customer_id) if b.customer_id else None,
            "customer_name": b.customer.full_name if b.customer else "Customer",
            "customer_phone": b.customer.phone if b.customer else None,
            "professional_id": str(b.professional_id) if b.professional_id else None,
            "service_id": str(b.service_id) if b.service_id else None,
            "service_name": b.service_name or (b.service.name if b.service else "Coconut Harvesting"),
            "tree_count": b.tree_count or 1,
            "height_category": b.height_category,
            "taluka": b.taluka or "North Goa",
            "address": b.address or "Goa",
            "scheduled_at": b.scheduled_at.isoformat() if b.scheduled_at else None,
            "status": b.status,
            "booking_type": b_type,
            "call_confirmed": bool(call_ok),
            "quote_amount": float(b.quote_amount) if b.quote_amount else 0.0,
            "payment_method": b.payment.payment_method if b.payment else "UPI",
            "payment_status": "paid" if (not b.payment or b.payment.status == "success") else b.payment.status,
            "tree_photo": b.tree_photo,
            "created_at": b.created_at.isoformat() if b.created_at else None
        })
    return results

@router.post("/bookings/{booking_id}/confirm-call")
def confirm_urgent_call(booking_id: str, db: Session = Depends(get_db)):
    try:
        bid = uuid.UUID(booking_id)
        booking = db.query(Booking).filter(Booking.id == bid).first()
    except Exception:
        booking = None

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.call_confirmed = True
    db.commit()
    return {"success": True, "message": "Urgent phone confirmation verified"}

@router.post("/bookings/{booking_id}/assign")
def assign_booking_professional(booking_id: str, req: AssignRequest, db: Session = Depends(get_db)):
    try:
        bid = uuid.UUID(booking_id)
        pid = uuid.UUID(req.professional_id)
        booking = db.query(Booking).filter(Booking.id == bid).first()
        prof = db.query(User).filter(User.id == pid, User.role == "professional").first()
    except Exception:
        booking = None
        prof = None

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.professional_id = prof.id if prof else None
    booking.status = "assigned"
    db.commit()
    return {"success": True, "message": "Professional assigned successfully"}

@router.get("/payments")
def get_payments(db: Session = Depends(get_db)):
    payments = db.query(Payment).all()
    return [
        {
            "id": str(p.id),
            "booking_id": str(p.booking_id) if p.booking_id else None,
            "amount": float(p.amount),
            "payment_method": p.payment_method,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in payments
    ]

@router.get("/reviews")
def get_reviews(db: Session = Depends(get_db)):
    reviews = db.query(Review).all()
    return [
        {
            "id": str(r.id),
            "booking_id": str(r.booking_id) if r.booking_id else None,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in reviews
    ]

@router.get("/incidents")
def get_incidents(db: Session = Depends(get_db)):
    incidents = db.query(Incident).order_by(Incident.created_at.desc()).all()
    return [
        {
            "id": str(i.id),
            "booking_id": str(i.booking_id) if i.booking_id else None,
            "reported_by_id": str(i.reported_by) if i.reported_by else None,
            "reported_by_name": i.reported_by_name or (i.reporter.full_name if i.reporter else "Professional"),
            "type": i.incident_type or "Near-miss",
            "severity": i.severity or "low",
            "description": i.description,
            "status": i.status,
            "created_at": i.created_at.isoformat() if i.created_at else None
        }
        for i in incidents
    ]


@router.post("/incidents")
def create_incident(data: dict, db: Session = Depends(get_db)):
    bid = None
    if data.get("booking_id"):
        try:
            bid = uuid.UUID(str(data["booking_id"]))
        except Exception:
            bid = None
    rep_id = None
    if data.get("reported_by_id"):
        try:
            rep_id = uuid.UUID(str(data["reported_by_id"]))
        except Exception:
            rep_id = None

    incident = Incident(
        booking_id=bid,
        reported_by=rep_id,
        reported_by_name=data.get("reported_by_name") or "Professional",
        incident_type=data.get("type") or "Near-miss",
        severity=data.get("severity") or "low",
        description=(data.get("description") or "Safety report").strip(),
        status="open"
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return {
        "id": str(incident.id),
        "booking_id": str(incident.booking_id) if incident.booking_id else None,
        "reported_by_id": str(incident.reported_by) if incident.reported_by else None,
        "reported_by_name": incident.reported_by_name,
        "type": incident.incident_type,
        "severity": incident.severity,
        "description": incident.description,
        "status": incident.status,
        "created_at": incident.created_at.isoformat() if incident.created_at else None
    }

@router.patch("/incidents/{incident_id}")
def update_incident_status(incident_id: str, data: dict, db: Session = Depends(get_db)):
    try:
        iid = uuid.UUID(incident_id)
        incident = db.query(Incident).filter(Incident.id == iid).first()
    except Exception:
        incident = None

    if incident:
        incident.status = data.get("status", "resolved")
        db.commit()

    return {
        "success": True,
        "incident_id": incident_id,
        "status": data.get("status", "resolved"),
        "message": "Incident status updated successfully"
    }

@router.get("/reports")
def get_reports(db: Session = Depends(get_db)):
    return {
        "monthly_revenue": 45000.0,
        "completed_jobs": 128,
        "active_climbers": 24,
        "safety_rating": 4.9
    }
