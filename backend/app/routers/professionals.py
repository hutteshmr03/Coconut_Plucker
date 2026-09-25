import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.models.user import User
from app.models.booking import Booking
from app.models.professional import ProfessionalProfile
from app.models.service import ProfessionalSkill
from app.schemas.auth import UserOut
from app.routers.auth import format_user_out

router = APIRouter(prefix="/professionals", tags=["Professionals"])

class SkillsUpdate(BaseModel):
    service_ids: List[str]

@router.get("/me", response_model=UserOut)
def get_professional_me(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.role == "professional").first()
    if not user:
        raise HTTPException(status_code=404, detail="Professional not found")
    return format_user_out(user, db)

@router.put("/me/skills")
def update_professional_skills(req: SkillsUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.role == "professional").first()
    if not user:
        raise HTTPException(status_code=404, detail="Professional not found")

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

@router.get("/me/bookings")
def get_professional_bookings(db: Session = Depends(get_db)):
    bookings = db.query(Booking).all()
    results = []
    for b in bookings:
        results.append({
            "id": str(b.id),
            "customer_name": b.customer.full_name if b.customer else "Customer",
            "service_name": b.service.name if b.service else "Harvesting",
            "taluka": "North Goa",
            "scheduled_at": b.scheduled_at.isoformat() if b.scheduled_at else None,
            "status": b.status,
            "quote_amount": float(b.quote_amount) if b.quote_amount else 0.0
        })
    return results

@router.post("/me/bookings/{booking_id}/start")
def start_booking(booking_id: str, db: Session = Depends(get_db)):
    try:
        bid = uuid.UUID(booking_id)
        booking = db.query(Booking).filter(Booking.id == bid).first()
    except Exception:
        booking = None
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = "in_progress"
    db.commit()
    return {"success": True, "status": "in_progress", "message": "Job marked as in progress"}

@router.post("/me/bookings/{booking_id}/complete")
def complete_booking(booking_id: str, db: Session = Depends(get_db)):
    try:
        bid = uuid.UUID(booking_id)
        booking = db.query(Booking).filter(Booking.id == bid).first()
    except Exception:
        booking = None
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = "completed"
    db.commit()
    return {"success": True, "status": "completed", "message": "Job marked as completed"}
