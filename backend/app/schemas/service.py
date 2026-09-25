from typing import Optional
from pydantic import BaseModel
import uuid

class ServiceCreate(BaseModel):
    name: str
    base_rate: float
    unit: str = "per tree"
    desc: Optional[str] = None
    icon: Optional[str] = "🌴"
    requires_height_category: bool = False

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    base_rate: Optional[float] = None
    unit: Optional[str] = None
    desc: Optional[str] = None
    requires_height_category: Optional[bool] = None

class ServiceOut(BaseModel):
    id: str
    name: str
    base_rate: float
    unit: str
    desc: Optional[str] = None
    icon: Optional[str] = "🌴"
    requires_height_category: bool = False
    status: str = "active"
