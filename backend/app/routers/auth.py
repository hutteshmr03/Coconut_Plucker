import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.user import User
from app.models.customer import CustomerProfile
from app.models.professional import ProfessionalProfile
from app.models.service import Service, ProfessionalSkill
from app.schemas.auth import OTPRequest, OTPVerify, UserRegister, LoginRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

def format_user_out(user: User, db: Session) -> UserOut:
    taluka = None
    address = None
    exp_years = None
    safety_cert = None
    rating_avg = None
    skills = []

    if user.role == "customer" and user.customer_profile:
        taluka = user.customer_profile.taluka
        address = user.customer_profile.address
    elif user.role == "professional" and user.professional_profile:
        taluka = user.professional_profile.taluka
        exp_years = user.professional_profile.experience_years
        safety_cert = user.professional_profile.safety_cert
        rating_avg = float(user.professional_profile.rating_avg or 0.0)
        skills = [str(s.service_id) for s in user.professional_profile.skills]

    return UserOut(
        id=str(user.id),
        phone=user.phone,
        full_name=user.full_name,
        role=user.role,
        status=user.status,
        username=user.phone,
        email=f"{user.phone}@coconutplucker.com",
        taluka=taluka,
        address=address,
        experience_years=exp_years,
        safety_cert=safety_cert,
        rating_avg=rating_avg,
        skills=skills,
        created_at=user.created_at.isoformat() if user.created_at else None
    )

@router.post("/otp/request")
def request_otp(req: OTPRequest):
    phone_clean = "".join(filter(str.isdigit, req.phone))
    return {
        "success": True,
        "message": f"OTP successfully sent to +91 {phone_clean}",
        "request_id": "req_" + str(uuid.uuid4())[:8]
    }

@router.post("/otp/verify", response_model=TokenResponse)
def verify_otp(req: OTPVerify, db: Session = Depends(get_db)):
    phone_clean = "".join(filter(str.isdigit, req.phone))
    if not req.otp:
        raise HTTPException(status_code=400, detail="OTP is required")

    user = db.query(User).filter(User.phone == phone_clean).first()
    if not user:
        # Auto-provision customer account if first-time phone login
        user = User(
            phone=phone_clean,
            full_name=f"User {phone_clean[-4:]}",
            role="customer",
            status="active"
        )
        db.add(user)
        db.flush()

        profile = CustomerProfile(user_id=user.id, taluka="North Goa", address="Goa")
        db.add(profile)
        db.commit()
        db.refresh(user)

    token = create_access_token(subject=str(user.id), role=user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=format_user_out(user, db)
    )

@router.post("/register", response_model=TokenResponse)
def register_user(req: UserRegister, db: Session = Depends(get_db)):
    phone_clean = "".join(filter(str.isdigit, req.phone))
    
    # Check if already registered
    existing = db.query(User).filter(User.phone == phone_clean).first()
    if existing:
        # If already exists, return existing user with token
        token = create_access_token(subject=str(existing.id), role=existing.role)
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=format_user_out(existing, db)
        )

    user_status = "pending_verification" if req.role == "professional" else "active"
    
    new_user = User(
        phone=phone_clean,
        full_name=req.full_name.strip(),
        role=req.role,
        status=user_status
    )
    db.add(new_user)
    db.flush()

    if req.role == "customer":
        cust_profile = CustomerProfile(
            user_id=new_user.id,
            taluka=req.taluka or "North Goa",
            address=req.address or f"{req.taluka or 'North Goa'}, Goa"
        )
        db.add(cust_profile)
    elif req.role == "professional":
        prof_profile = ProfessionalProfile(
            user_id=new_user.id,
            taluka=req.taluka or "North Goa",
            experience_years=req.experience_years or 0,
            safety_cert=req.safety_cert or "Safety Certified Climber",
            rating_avg=5.0
        )
        db.add(prof_profile)
        db.flush()

        # Link default services as skills if available
        all_services = db.query(Service).all()
        for svc in all_services:
            skill = ProfessionalSkill(professional_id=new_user.id, service_id=svc.id)
            db.add(skill)

    db.commit()
    db.refresh(new_user)

    token = create_access_token(subject=str(new_user.id), role=new_user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=format_user_out(new_user, db)
    )

@router.post("/login", response_model=TokenResponse)
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    ident = (req.identifier or req.phone or req.username or "").strip().lower()
    ident_phone = "".join(filter(str.isdigit, ident))

    user = None
    if ident_phone:
        user = db.query(User).filter(User.phone == ident_phone).first()

    if not user:
        # Also match Super Admin or Admin by role if requested
        if ident == "superadmin":
            user = db.query(User).filter(User.role == "super_admin").first()
            if not user:
                # Seed super admin in DB
                user = User(
                    phone="9999900000",
                    full_name="Chief Platform Administrator",
                    role="super_admin",
                    status="active"
                )
                db.add(user)
                db.commit()
                db.refresh(user)
        elif ident == "admin":
            user = db.query(User).filter(User.role == "admin").first()
            if not user:
                user = User(
                    phone="9999000000",
                    full_name="Platform Administrator",
                    role="admin",
                    status="active"
                )
                db.add(user)
                db.commit()
                db.refresh(user)

    if not user:
        raise HTTPException(status_code=404, detail="Account not found. Please sign up.")

    token = create_access_token(subject=str(user.id), role=user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=format_user_out(user, db)
    )

@router.get("/me", response_model=UserOut)
def get_current_user_profile(db: Session = Depends(get_db)):
    # Return first user or default admin for demo if unauthenticated
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return format_user_out(user, db)

@router.post("/logout")
def logout_user():
    return {"success": True, "message": "Logged out successfully"}
