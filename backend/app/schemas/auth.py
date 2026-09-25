from typing import Optional, List
from pydantic import BaseModel, Field
import uuid

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str
    requestId: Optional[str] = None

class UserRegister(BaseModel):
    phone: str
    full_name: str
    role: str = Field(..., pattern="^(customer|professional|admin|super_admin)$")
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    taluka: Optional[str] = "North Goa"
    address: Optional[str] = None
    experience_years: Optional[int] = 0
    safety_cert: Optional[str] = None
    skills: Optional[List[str]] = None

class LoginRequest(BaseModel):
    identifier: Optional[str] = None
    phone: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

class UserOut(BaseModel):
    id: str
    phone: str
    full_name: str
    role: str
    status: str
    username: Optional[str] = None
    email: Optional[str] = None
    taluka: Optional[str] = None
    address: Optional[str] = None
    experience_years: Optional[int] = None
    safety_cert: Optional[str] = None
    rating_avg: Optional[float] = None
    skills: Optional[List[str]] = None
    created_at: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
