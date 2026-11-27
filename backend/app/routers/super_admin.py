import uuid
from datetime import timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.core.config import settings
from app.core.database import get_db
from app.core.audit import record_audit_log
from app.core.security import create_access_token, decode_access_token, pwd_context
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.auth import UserOut
from app.routers.auth import format_user_out

security = HTTPBearer(auto_error=False)

def require_super_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    role = payload.get("role")
    if role != "super_admin":
        raise HTTPException(status_code=403, detail="Super Admin privileges required")
    return payload

router = APIRouter(prefix="/super-admin", tags=["Super Admin Governance"], dependencies=[Depends(require_super_admin)])

class CreateAdminRequest(BaseModel):
    full_name: str
    phone: str
    username: Optional[str] = None
    email: Optional[str] = None
    taluka: Optional[str] = "All Talukas"
    password: str = Field(..., min_length=6)

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
        status="active",
        password_hash=pwd_context.hash(req.password.strip())
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    record_audit_log(
        db,
        actor="Chief Platform Admin",
        action="Provisioned New Admin Account",
        target=f"{admin.full_name} ({admin.phone})",
        details=f"Role: Admin. Regional Scope: {req.taluka or 'All Talukas'}."
    )
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
    record_audit_log(
        db,
        actor="Chief Platform Admin",
        action="Updated Admin Status",
        target=f"{admin.full_name} ({admin.phone})",
        details=f"Administrator account status changed to '{req.status}'."
    )
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

    target_label = f"{admin.full_name} ({admin.phone})"
    db.delete(admin)
    db.commit()
    record_audit_log(
        db,
        actor="Chief Platform Admin",
        action="Deleted Admin Account",
        target=target_label,
        details="Administrator account permanently removed."
    )
    return {"success": True, "message": "Admin deleted successfully"}

@router.post("/change-password")
def change_password(req: PasswordChangeRequest, db: Session = Depends(get_db)):
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")
    sa = db.query(User).filter(User.role == "super_admin").first()
    if not sa:
        raise HTTPException(status_code=404, detail="Super Admin account not found.")

    is_valid = False
    if sa.password_hash:
        is_valid = pwd_context.verify(req.current_password, sa.password_hash)
    elif settings.DEFAULT_SUPER_ADMIN_PASSWORD and req.current_password == settings.DEFAULT_SUPER_ADMIN_PASSWORD:
        is_valid = True

    if not is_valid:
        raise HTTPException(status_code=400, detail="Current password does not match.")

    sa.password_hash = pwd_context.hash(req.new_password.strip())
    db.commit()
    return {"success": True, "message": "Super Admin master password changed successfully."}

@router.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()
    results = []
    for l in logs:
        ts = l.created_at
        if ts and ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        results.append({
            "id": str(l.id),
            "actor": l.actor,
            "action": l.action,
            "target": l.target,
            "timestamp": ts.isoformat() if ts else None,
            "details": l.details or ""
        })
    return results

@router.post("/login")
def super_admin_login(data: dict, db: Session = Depends(get_db)):
    username = data.get("username", "").strip().lower()
    password = data.get("password", "").strip()
    sa = db.query(User).filter(User.role == "super_admin").first()
    if sa and username in ["superadmin", "9999900000"]:
        ok = (
            pwd_context.verify(password, sa.password_hash)
            if sa.password_hash
            else (bool(settings.DEFAULT_SUPER_ADMIN_PASSWORD) and password == settings.DEFAULT_SUPER_ADMIN_PASSWORD)
        )
        if ok:
            return {
                "access_token": create_access_token(subject=str(sa.id), role="super_admin"),
                "token_type": "bearer",
                "user": format_user_out(sa, db)
            }
    raise HTTPException(status_code=401, detail="Invalid Super Admin credentials.")
from app.core.scheduling_state import get_active_scheduling_config, update_active_scheduling_config

@router.get("/scheduling-config")
def get_scheduling_config():
    return get_active_scheduling_config()

@router.put("/scheduling-config")
def update_scheduling_config(data: dict):
    updated = update_active_scheduling_config(data)
    return {
        "success": True,
        "config": updated,
        "message": "Regional scheduling configuration updated successfully"
    }
