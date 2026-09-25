import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.models.user import User
from app.models.booking import Booking
from app.models.incident import Incident
from app.models.payment import Payment
from app.models.review import Review
from app.schemas.auth import UserOut
from app.routers.auth import format_user_out

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

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
    customers = db.query(User).filter(User.role == "customer").all()
    return [format_user_out(c, db) for c in customers]

@router.get("/professionals", response_model=List[UserOut])
def get_admin_professionals(db: Session = Depends(get_db)):
    professionals = db.query(User).filter(User.role == "professional").all()
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

@router.get("/bookings")
def get_all_bookings(db: Session = Depends(get_db)):
    bookings = db.query(Booking).all()
    results = []
    for b in bookings:
        results.append({
            "id": str(b.id),
            "customer_id": str(b.customer_id) if b.customer_id else None,
            "professional_id": str(b.professional_id) if b.professional_id else None,
            "service_id": str(b.service_id) if b.service_id else None,
            "service_name": b.service.name if b.service else "Coconut Harvesting",
            "scheduled_at": b.scheduled_at.isoformat() if b.scheduled_at else None,
            "status": b.status,
            "quote_amount": float(b.quote_amount) if b.quote_amount else 0.0,
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

    booking.status = "confirmed"
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
    incidents = db.query(Incident).all()
    return [
        {
            "id": str(i.id),
            "booking_id": str(i.booking_id) if i.booking_id else None,
            "reported_by": str(i.reported_by) if i.reported_by else None,
            "description": i.description,
            "severity": i.severity,
            "status": i.status,
            "created_at": i.created_at.isoformat() if i.created_at else None
        }
        for i in incidents
    ]

@router.get("/reports")
def get_reports(db: Session = Depends(get_db)):
    return {
        "monthly_revenue": 45000.0,
        "completed_jobs": 128,
        "active_climbers": 24,
        "safety_rating": 4.9
    }
