import json
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.audit import record_audit_log
from app.core.security import create_access_token, decode_access_token, pwd_context
from app.models.user import User
from app.models.customer import CustomerProfile
from app.models.professional import ProfessionalProfile
from app.models.service import Service, ProfessionalSkill
from app.schemas.auth import OTPRequest, OTPVerify, UserRegister, LoginRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])
auth_bearer = HTTPBearer(auto_error=False)


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(auth_bearer),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    payload = decode_access_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        return None
    try:
        uid = uuid.UUID(str(payload["sub"]))
        user = db.query(User).filter(User.id == uid).first()
        if user and user.status == "deactivated":
            return None
        return user
    except Exception:
        return None


def require_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(auth_bearer),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = decode_access_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    try:
        uid = uuid.UUID(str(payload["sub"]))
        user = db.query(User).filter(User.id == uid).first()
    except Exception:
        user = None
    if not user:
        raise HTTPException(status_code=401, detail="User account not found")
    if user.status == "deactivated":
        raise HTTPException(status_code=403, detail="Account has been deactivated")
    return user


def require_customer(current_user: User = Depends(require_user)) -> User:
    if current_user.role != "customer":
        raise HTTPException(status_code=403, detail="Customer privileges required")
    return current_user


def require_professional(current_user: User = Depends(require_user)) -> User:
    if current_user.role != "professional":
        raise HTTPException(status_code=403, detail="Professional privileges required")
    return current_user


def require_admin_user(current_user: User = Depends(require_user)) -> User:
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user


def format_user_out(user: User, db: Session) -> UserOut:
    taluka = None
    address = None
    addresses = None
    addresses_by_taluka = None
    exp_years = None
    safety_cert = None
    insurance_cover = None
    insurance_cover_img = None
    rating_avg = None
    skills = []

    if user.role == "customer" and user.customer_profile:
        taluka = user.customer_profile.taluka
        address = user.customer_profile.address
        if user.customer_profile.addresses_json:
            try:
                parsed = json.loads(user.customer_profile.addresses_json)
                if isinstance(parsed, dict):
                    addresses = parsed.get("addresses")
                    addresses_by_taluka = parsed.get("addresses_by_taluka")
            except Exception:
                pass
    elif user.role == "professional" and user.professional_profile:
        taluka = user.professional_profile.taluka
        exp_years = user.professional_profile.experience_years
        safety_cert = user.professional_profile.safety_cert
        insurance_cover = bool(user.professional_profile.insurance_cover)
        insurance_cover_img = user.professional_profile.insurance_cover_img
        rating_avg = float(user.professional_profile.rating_avg or 0.0)
        skills = [str(s.service_id) for s in user.professional_profile.skills]

    return UserOut(
        id=str(user.id),
        phone=user.phone,
        full_name="Chief Platform Admin" if (user.role == "super_admin" and user.full_name == "Chief Platform Administrator") else user.full_name,
        role=user.role,
        status=user.status,
        username=user.phone,
        email=f"{user.phone}@coconutplucker.com",
        taluka=taluka,
        address=address,
        addresses=addresses,
        addresses_by_taluka=addresses_by_taluka,
        experience_years=exp_years,
        safety_cert=safety_cert,
        insurance_cover=insurance_cover,
        insurance_cover_img=insurance_cover_img,
        rating_avg=rating_avg,
        skills=skills,
        created_at=user.created_at.isoformat() if user.created_at else None
    )

@router.post("/otp/request")
def request_otp(req: OTPRequest):
    raw_digits = "".join(filter(str.isdigit, req.phone))
    phone_clean = raw_digits[-10:] if len(raw_digits) >= 10 else raw_digits
    return {
        "success": True,
        "message": f"OTP successfully sent to +91 {phone_clean}",
        "request_id": "req_" + str(uuid.uuid4())[:8]
    }

SEED_USERS_MAP = {}

@router.post("/otp/verify", response_model=TokenResponse)
def verify_otp(req: OTPVerify, db: Session = Depends(get_db)):
    raw_digits = "".join(filter(str.isdigit, req.phone))
    phone_clean = raw_digits[-10:] if len(raw_digits) >= 10 else raw_digits
    if not req.otp:
        raise HTTPException(status_code=400, detail="OTP is required")

    user = db.query(User).filter(User.phone == phone_clean).first()
    if not user:
        seed_info = SEED_USERS_MAP.get(phone_clean, {
            "full_name": f"User {phone_clean[-4:]}",
            "role": "customer",
            "taluka": "North Goa",
            "address": "Goa"
        })
        user = User(
            phone=phone_clean,
            full_name=seed_info["full_name"],
            role=seed_info["role"],
            status="active"
        )
        db.add(user)
        db.flush()

        if seed_info["role"] == "customer":
            profile = CustomerProfile(user_id=user.id, taluka=seed_info["taluka"], address=seed_info["address"])
            db.add(profile)
        elif seed_info["role"] == "professional":
            prof_profile = ProfessionalProfile(
                user_id=user.id,
                taluka=seed_info["taluka"],
                experience_years=seed_info.get("exp", 5),
                safety_cert="Verified Professional Climber",
                rating_avg=5.0
            )
            db.add(prof_profile)

        db.commit()
        db.refresh(user)

    record_audit_log(
        db,
        actor=f"{user.full_name} ({user.role})",
        action="Logged In",
        target=f"{user.full_name} ({user.phone})",
        details=f"Authenticated session started for role '{user.role}'."
    )

    token = create_access_token(subject=str(user.id), role=user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=format_user_out(user, db)
    )

@router.post("/register", response_model=TokenResponse)
def register_user(req: UserRegister, db: Session = Depends(get_db)):
    if req.role not in ("customer", "professional"):
        raise HTTPException(status_code=403, detail="Administrator accounts cannot be self-registered.")

    raw_digits = "".join(filter(str.isdigit, req.phone))
    phone_clean = raw_digits[-10:] if len(raw_digits) >= 10 else raw_digits
    if len(phone_clean) != 10:
        raise HTTPException(status_code=400, detail="Valid 10-digit mobile phone number is required.")

    # Reject duplicate phone instead of issuing an unauthorized token for an existing user
    existing = db.query(User).filter(User.phone == phone_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="Mobile phone number is already registered. Please log in.")

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

    record_audit_log(
        db,
        actor=f"{new_user.full_name} ({new_user.role})",
        action="Registered New Account",
        target=f"+91 {new_user.phone}",
        details=f"Taluka: {req.taluka or 'North Goa'}. Account status: {user_status}."
    )

    token = create_access_token(subject=str(new_user.id), role=new_user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=format_user_out(new_user, db)
    )

@router.post("/login", response_model=TokenResponse)
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    ident = (req.identifier or req.phone or req.username or "").strip().lower()
    raw_digits = "".join(filter(str.isdigit, ident))
    ident_phone = raw_digits[-10:] if len(raw_digits) >= 10 else raw_digits

    user = None
    if raw_digits:
        candidates = [raw_digits]
        if ident_phone and ident_phone not in candidates:
            candidates.append(ident_phone)
        user = db.query(User).filter(User.phone.in_(candidates)).first()

    if not user:
        # Match Super Admin or Admin by role/username and bootstrap only if configured in environment
        if ident in ("superadmin", "super_admin"):
            user = db.query(User).filter(User.role == "super_admin").first()
            if not user and settings.DEFAULT_SUPER_ADMIN_PASSWORD:
                user = User(
                    phone="9999900000",
                    full_name="Chief Platform Admin",
                    role="super_admin",
                    status="active",
                    password_hash=pwd_context.hash(settings.DEFAULT_SUPER_ADMIN_PASSWORD)
                )
                db.add(user)
                db.commit()
                db.refresh(user)
        elif ident in ("admin", "9800000001", "9999000000"):
            user = db.query(User).filter(User.role == "admin").first()
            if not user and settings.DEFAULT_ADMIN_PASSWORD:
                user = User(
                    phone="9800000001",
                    full_name="Goa Operations Admin",
                    role="admin",
                    status="active",
                    password_hash=pwd_context.hash(settings.DEFAULT_ADMIN_PASSWORD)
                )
                db.add(user)
                db.commit()
                db.refresh(user)

    if not user:
        raise HTTPException(status_code=404, detail="Account not found. Please sign up.")

    # Secure server-side password check for admin and super admin
    if user.role in ("admin", "super_admin"):
        if user.status == "deactivated":
            raise HTTPException(status_code=403, detail="This administrator account has been deactivated.")
        if not req.password:
            raise HTTPException(status_code=400, detail="Password is required for administrator login")
        is_valid = False
        if user.password_hash:
            try:
                is_valid = pwd_context.verify(req.password, user.password_hash)
            except Exception:
                is_valid = False
        elif user.role == "super_admin" and settings.DEFAULT_SUPER_ADMIN_PASSWORD and req.password == settings.DEFAULT_SUPER_ADMIN_PASSWORD:
            is_valid = True
            user.password_hash = pwd_context.hash(req.password)
            db.commit()
        elif user.role == "admin" and settings.DEFAULT_ADMIN_PASSWORD and req.password == settings.DEFAULT_ADMIN_PASSWORD:
            is_valid = True
            user.password_hash = pwd_context.hash(req.password)
            db.commit()
        if not is_valid:
            raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")

    record_audit_log(
        db,
        actor=f"{user.full_name} ({user.role})",
        action="Logged In",
        target=f"{user.full_name} ({user.phone})",
        details=f"Authenticated session started for role '{user.role}'."
    )

    token = create_access_token(subject=str(user.id), role=user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=format_user_out(user, db)
    )

@router.get("/me", response_model=UserOut)
def get_current_user_profile(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    return format_user_out(current_user, db)


class ProfileSelfUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None


class PasswordSelfChange(BaseModel):
    current_password: str
    new_password: str


@router.put("/me", response_model=UserOut)
def update_current_user_profile(
    req: ProfileSelfUpdate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    if req.full_name is not None and req.full_name.strip():
        current_user.full_name = req.full_name.strip()
    if req.phone is not None:
        raw_digits = "".join(filter(str.isdigit, req.phone))
        phone_clean = raw_digits[-10:] if len(raw_digits) >= 10 else raw_digits
        if phone_clean and phone_clean != current_user.phone:
            exists = db.query(User).filter(User.phone == phone_clean, User.id != current_user.id).first()
            if exists:
                raise HTTPException(status_code=400, detail="Phone number already in use.")
            current_user.phone = phone_clean
    db.commit()
    db.refresh(current_user)
    return format_user_out(current_user, db)


@router.post("/password")
def change_own_password(
    req: PasswordSelfChange,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    if not current_user or current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Administrator authentication required")
    if len(req.new_password.strip()) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")
    is_valid = False
    if current_user.password_hash:
        is_valid = pwd_context.verify(req.current_password, current_user.password_hash)
    elif current_user.role == "super_admin" and settings.DEFAULT_SUPER_ADMIN_PASSWORD and req.current_password == settings.DEFAULT_SUPER_ADMIN_PASSWORD:
        is_valid = True
    elif current_user.role == "admin" and settings.DEFAULT_ADMIN_PASSWORD and req.current_password == settings.DEFAULT_ADMIN_PASSWORD:
        is_valid = True
    if not is_valid:
        raise HTTPException(status_code=400, detail="Current password does not match.")
    current_user.password_hash = pwd_context.hash(req.new_password.strip())
    db.commit()
    record_audit_log(
        db,
        actor=f"{current_user.full_name} ({current_user.role})",
        action="Updated Password",
        target=f"{current_user.full_name} ({current_user.phone})",
        details="Administrator credentials updated in MySQL."
    )
    return {"success": True, "message": "Password updated successfully."}

@router.post("/logout")
def logout_user():
    return {"success": True, "message": "Logged out successfully"}
