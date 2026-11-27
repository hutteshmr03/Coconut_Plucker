import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.customer import CustomerProfile
from app.schemas.auth import UserOut, UserUpdate
from app.routers.auth import format_user_out, require_customer

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("/me", response_model=UserOut)
def get_customer_me(
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    return format_user_out(current_user, db)

@router.put("/me", response_model=UserOut)
def update_customer_me(
    req: UserUpdate,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    user = current_user
    if req.full_name is not None:
        user.full_name = req.full_name
    if req.phone is not None:
        raw_digits = "".join(filter(str.isdigit, req.phone))
        phone_clean = raw_digits[-10:] if len(raw_digits) >= 10 else raw_digits
        if phone_clean and phone_clean != user.phone:
            exists = db.query(User).filter(User.phone == phone_clean, User.id != user.id).first()
            if not exists:
                user.phone = phone_clean

    profile = db.query(CustomerProfile).filter(CustomerProfile.user_id == user.id).first()
    if not profile and (
        req.taluka is not None
        or req.address is not None
        or req.addresses is not None
        or req.addresses_by_taluka is not None
    ):
        profile = CustomerProfile(user_id=user.id, taluka=req.taluka or "North Goa", address=req.address or "Goa")
        db.add(profile)
        db.flush()
    if profile:
        if req.taluka is not None:
            profile.taluka = req.taluka
        if req.address is not None:
            profile.address = req.address
        if req.addresses is not None or req.addresses_by_taluka is not None:
            existing_data = {}
            if profile.addresses_json:
                try:
                    existing_data = json.loads(profile.addresses_json) or {}
                except Exception:
                    existing_data = {}
            if req.addresses is not None:
                existing_data["addresses"] = req.addresses
            if req.addresses_by_taluka is not None:
                existing_data["addresses_by_taluka"] = req.addresses_by_taluka
            profile.addresses_json = json.dumps(existing_data)

    db.commit()
    db.refresh(user)
    return format_user_out(user, db)
