import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceOut

router = APIRouter(prefix="/services", tags=["Services"])

@router.get("", response_model=List[ServiceOut])
def get_active_services(db: Session = Depends(get_db)):
    services = db.query(Service).all()
    if not services:
        # Seed default services in database if empty
        default_services = [
            Service(name="Coconut Harvesting", base_rate=100.0, unit="per tree", requires_height_category=False),
            Service(name="Palm Crown Cleaning & Health Check", base_rate=120.0, unit="per tree", requires_height_category=False),
            Service(name="Nut Sorting & Bundling", base_rate=40.0, unit="per tree", requires_height_category=False),
            Service(name="Canopy & Tree Trimming", base_rate=200.0, unit="per tree", requires_height_category=True),
        ]
        db.add_all(default_services)
        db.commit()
        services = db.query(Service).all()

    return [
        ServiceOut(
            id=str(s.id),
            name=s.name,
            base_rate=float(s.base_rate),
            unit=s.unit,
            desc="Standard height and arboricultural maintenance service",
            icon="🌴",
            requires_height_category=s.requires_height_category,
            status="active"
        )
        for s in services
    ]

@router.get("/admin", response_model=List[ServiceOut])
def get_admin_services(db: Session = Depends(get_db)):
    return get_active_services(db)

@router.get("/{service_id}", response_model=ServiceOut)
def get_service_detail(service_id: str, db: Session = Depends(get_db)):
    try:
        sid = uuid.UUID(service_id)
        svc = db.query(Service).filter(Service.id == sid).first()
    except Exception:
        svc = db.query(Service).first()

    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")

    return ServiceOut(
        id=str(svc.id),
        name=svc.name,
        base_rate=float(svc.base_rate),
        unit=svc.unit,
        desc="Standard service",
        icon="🌴",
        requires_height_category=svc.requires_height_category,
        status="active"
    )

@router.post("", response_model=ServiceOut)
def create_service(req: ServiceCreate, db: Session = Depends(get_db)):
    svc = Service(
        name=req.name,
        base_rate=req.base_rate,
        unit=req.unit,
        requires_height_category=req.requires_height_category
    )
    db.add(svc)
    db.commit()
    db.refresh(svc)

    return ServiceOut(
        id=str(svc.id),
        name=svc.name,
        base_rate=float(svc.base_rate),
        unit=svc.unit,
        desc=req.desc or "Custom service",
        icon=req.icon or "🌴",
        requires_height_category=svc.requires_height_category,
        status="active"
    )
