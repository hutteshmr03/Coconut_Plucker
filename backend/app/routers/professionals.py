import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from app.core.database import get_db
from app.models.user import User
from app.models.booking import Booking
from app.models.professional import ProfessionalProfile
from app.models.service import ProfessionalSkill
from app.schemas.auth import UserOut, UserUpdate
from app.routers.auth import format_user_out, require_professional

router = APIRouter(prefix="/professionals", tags=["Professionals"])

class SkillsUpdate(BaseModel):
    service_ids: List[str]

@router.get("/me", response_model=UserOut)
def get_professional_me(
    current_user: User = Depends(require_professional),
    db: Session = Depends(get_db)
):
    return format_user_out(current_user, db)

@router.put("/me", response_model=UserOut)
def update_professional_me(
    req: UserUpdate,
    current_user: User = Depends(require_professional),
    db: Session = Depends(get_db)
):
    user = current_user

    if req.full_name is not None:
        user.full_name = req.full_name
    if req.phone is not None:
        user.phone = req.phone
    
    prof = db.query(ProfessionalProfile).filter(ProfessionalProfile.user_id == user.id).first()
    if not prof:
        prof = ProfessionalProfile(
            user_id=user.id,
            taluka=req.taluka or "North Goa",
            experience_years=req.experience_years or 1,
            safety_cert=req.safety_cert or "Certified Climber",
            rating_avg=5.0
        )
        db.add(prof)
    else:
        if req.taluka is not None:
            prof.taluka = req.taluka
        if req.experience_years is not None:
            prof.experience_years = req.experience_years
        if req.safety_cert is not None:
            prof.safety_cert = req.safety_cert

    if req.skills is not None:
        db.query(ProfessionalSkill).filter(ProfessionalSkill.professional_id == user.id).delete()
        for sid_str in req.skills:
            try:
                sid = uuid.UUID(sid_str)
                db.add(ProfessionalSkill(professional_id=user.id, service_id=sid))
            except Exception:
                pass

    db.commit()
    db.refresh(user)
    return format_user_out(user, db)

@router.put("/me/skills")
def update_professional_skills(
    req: SkillsUpdate,
    current_user: User = Depends(require_professional),
    db: Session = Depends(get_db)
):
    user = current_user

    # Clear existing skills and add selected
    db.query(ProfessionalSkill).filter(ProfessionalSkill.professional_id == user.id).delete()
    for sid_str in req.service_ids:
        try:
            sid = uuid.UUID(sid_str)
            skill = ProfessionalSkill(professional_id=user.id, service_id=sid)
            db.add(skill)
        except Exception:
            pass
    db.commit()
    return {"success": True, "message": "Skills updated successfully"}

def _to_utc_dt(dt: Optional[datetime]) -> Optional[datetime]:
    if not dt:
        return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)


def _to_utc_iso(dt: Optional[datetime]) -> Optional[str]:
    utc_dt = _to_utc_dt(dt)
    return utc_dt.isoformat() if utc_dt else None


def _is_customer_data_expired(booking: Booking) -> bool:
    if booking.status != "completed" or not booking.completed_at:
        return False
    completed_utc = _to_utc_dt(booking.completed_at)
    return (datetime.now(timezone.utc) - completed_utc) >= timedelta(hours=24)


@router.get("/me/bookings")
def get_professional_bookings(
    current_user: User = Depends(require_professional),
    db: Session = Depends(get_db)
):
    bookings = (
        db.query(Booking)
        .options(joinedload(Booking.service), joinedload(Booking.customer), joinedload(Booking.payment))
        .filter(Booking.professional_id == current_user.id)
        .all()
    )
    results = []
    for b in bookings:
        expired = _is_customer_data_expired(b)
        results.append({
            "id": str(b.id),
            "booking_number": b.booking_number or f"CP-{str(b.id)[:8].upper()}",
            "customer_id": str(b.customer_id) if b.customer_id else None,
            "customer_name": None if expired else (b.customer.full_name if b.customer else "Customer"),
            "customer_phone": None if expired else (b.customer.phone if b.customer else None),
            "customer_data_expired": expired,
            "professional_id": str(b.professional_id) if b.professional_id else None,
            "service_id": str(b.service_id) if b.service_id else None,
            "service_name": b.service_name or (b.service.name if b.service else "Harvesting"),
            "tree_count": b.tree_count or 1,
            "height_category": b.height_category,
            "taluka": b.taluka or "North Goa",
            "address": b.address or "Goa",
            "scheduled_at": _to_utc_iso(b.scheduled_at),
            "status": b.status,
            "booking_type": b.booking_type or "standard",
            "call_confirmed": b.call_confirmed if b.call_confirmed is not None else True,
            "quote_amount": float(b.quote_amount) if b.quote_amount else 0.0,
            "payment_method": b.payment.payment_method if b.payment else "UPI",
            "payment_status": "paid" if (b.payment and b.payment.status == "success") else "paid",
            "tree_photo": b.tree_photo,
            "completed_at": _to_utc_iso(b.completed_at),
            "created_at": _to_utc_iso(b.created_at)
        })
    return results

@router.post("/me/bookings/{booking_id}/start")
def start_booking(
    booking_id: str,
    current_user: User = Depends(require_professional),
    db: Session = Depends(get_db)
):
    try:
        bid = uuid.UUID(booking_id)
        booking = db.query(Booking).filter(Booking.id == bid).first()
    except Exception:
        booking = None
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.professional_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not assigned to this booking")

    booking.status = "in_progress"
    db.commit()
    return {"success": True, "status": "in_progress", "message": "Job marked as in progress"}

@router.post("/me/bookings/{booking_id}/complete")
def complete_booking(
    booking_id: str,
    current_user: User = Depends(require_professional),
    db: Session = Depends(get_db)
):
    try:
        bid = uuid.UUID(booking_id)
        booking = db.query(Booking).filter(Booking.id == bid).first()
    except Exception:
        booking = None
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.professional_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not assigned to this booking")

    now_utc = datetime.now(timezone.utc)
    booking.status = "completed"
    if not booking.completed_at:
        booking.completed_at = now_utc
    db.commit()
    return {
        "success": True,
        "status": "completed",
        "completed_at": _to_utc_iso(booking.completed_at),
        "message": "Job marked as completed"
    }

@router.get("/me/bookings/{booking_id}")
def get_professional_booking_detail(
    booking_id: str,
    current_user: User = Depends(require_professional),
    db: Session = Depends(get_db)
):
    try:
        bid = uuid.UUID(booking_id)
        booking = db.query(Booking).filter(Booking.id == bid).first()
    except Exception:
        booking = None
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.professional_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not assigned to this booking")

    expired = _is_customer_data_expired(booking)
    return {
        "id": str(booking.id),
        "customer_name": None if expired else (booking.customer.full_name if booking.customer else "Customer"),
        "customer_data_expired": expired,
        "service_name": booking.service.name if booking.service else "Harvesting",
        "taluka": booking.taluka or "North Goa",
        "scheduled_at": _to_utc_iso(booking.scheduled_at),
        "completed_at": _to_utc_iso(booking.completed_at),
        "status": booking.status,
        "quote_amount": float(booking.quote_amount) if booking.quote_amount else 0.0
    }
