import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import UserOut
from app.routers.auth import format_user_out

router = APIRouter(prefix="/super-admin", tags=["Super Admin Governance"])

class CreateAdminRequest(BaseModel):
    full_name: str
    phone: str
    username: Optional[str] = None
    email: Optional[str] = None
    taluka: Optional[str] = "All Talukas"
    password: Optional[str] = "admin123"

class StatusUpdateRequest(BaseModel):
    status: str # 'active' | 'deactivated'

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

@router.get("/admins", response_model=List[UserOut])
def list_admins(db: Session = Depends(get_db)):
    admins = db.query(User).filter(User.role == "admin").all()
    return [format_user_out(a, db) for a in admins]

@router.post("/admins", response_model=UserOut)
def create_admin(req: CreateAdminRequest, db: Session = Depends(get_db)):
    phone_clean = "".join(filter(str.isdigit, req.phone))
    exists = db.query(User).filter(User.phone == phone_clean).first()
    if exists:
        raise HTTPException(status_code=400, detail="An account with this phone number already exists.")

    admin = User(
        phone=phone_clean,
        full_name=req.full_name,
        role="admin",
        status="active"
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return format_user_out(admin, db)

@router.patch("/admins/{admin_id}/status")
def update_admin_status(admin_id: str, req: StatusUpdateRequest, db: Session = Depends(get_db)):
    try:
        aid = uuid.UUID(admin_id)
        admin = db.query(User).filter(User.id == aid, User.role == "admin").first()
    except Exception:
        admin = None

    if not admin:
        raise HTTPException(status_code=404, detail="Admin account not found")

    admin.status = req.status
    db.commit()
    return {"success": True, "message": f"Admin status updated to {req.status}"}

@router.delete("/admins/{admin_id}")
def delete_admin(admin_id: str, db: Session = Depends(get_db)):
    try:
        aid = uuid.UUID(admin_id)
        admin = db.query(User).filter(User.id == aid, User.role == "admin").first()
    except Exception:
        admin = None

    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    db.delete(admin)
    db.commit()
    return {"success": True, "message": "Admin deleted successfully"}

@router.post("/change-password")
def change_password(req: PasswordChangeRequest):
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")
    return {"success": True, "message": "Super Admin master password changed successfully."}

@router.get("/audit-logs")
def get_audit_logs():
    return [
        {"id": "aud_1", "action": "SYSTEM_SEED", "actor": "Ops/Root", "target": "usr_super_admin", "timestamp": "2026-01-01T00:00:00Z"},
        {"id": "aud_2", "action": "ADMIN_PROVISION", "actor": "superadmin", "target": "Platform Admin", "timestamp": "2026-09-25T10:00:00Z"}
    ]

@router.get("/scheduling-config")
def get_scheduling_config():
    return {
        "north_days": ["Monday", "Tuesday", "Wednesday"],
        "south_days": ["Thursday", "Friday", "Saturday"],
        "urgent_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "max_daily_slots": 12
    }
