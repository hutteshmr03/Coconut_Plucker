import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.audit import record_audit_log
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceOut

router = APIRouter(prefix="/services", tags=["Services"])

def _format_service(s: Service) -> ServiceOut:
    return ServiceOut(
        id=str(s.id),
        name=s.name,
        base_rate=float(s.base_rate),
        unit=s.unit,
        desc=s.description or "Standard height and arboricultural maintenance service",
        icon=s.icon or "🌴",
        requires_height_category=bool(s.requires_height_category),
        image_url=s.image_url,
        image=s.image_url,
        status=s.status or "active"
    )


def _seed_defaults_if_empty(db: Session) -> List[Service]:
    services = db.query(Service).all()
    if not services:
        default_services = [
            Service(name="Coconut Plucking", base_rate=90.0, unit="per tree", requires_height_category=False, icon="🥥", description="Plucking mature coconuts and cleaning the tree top.", status="active"),
            Service(name="Supari Plucking", base_rate=70.0, unit="per tree", requires_height_category=False, icon="🌰", description="Climbing slender trees to cut ripe supari bunches.", status="active"),
            Service(name="Mango Plucking", base_rate=120.0, unit="per tree", requires_height_category=False, icon="🥭", description="Gentle mango picking from branches without damaging fruits.", status="active"),
            Service(name="Jackfruit Plucking", base_rate=140.0, unit="per tree", requires_height_category=False, icon="🍈", description="Cutting and lowering heavy jackfruits safely using ropes.", status="active"),
            Service(name="Palm Leaf Cutting & Cleaning", base_rate=150.0, unit="per tree", requires_height_category=False, icon="🌿", description="Cutting dry palm leaves and cleaning the crown.", status="active"),
            Service(name="Tree Branch Cutting", base_rate=180.0, unit="per tree", requires_height_category=True, icon="✂️", description="Precision branch trimming near roofs and power lines.", status="active"),
        ]
        db.add_all(default_services)
        db.commit()
        services = db.query(Service).all()
    return services


@router.get("", response_model=List[ServiceOut])
def get_active_services(db: Session = Depends(get_db)):
    services = _seed_defaults_if_empty(db)
    return [_format_service(s) for s in services if (s.status or "active") == "active"]


@router.get("/admin", response_model=List[ServiceOut])
def get_admin_services(db: Session = Depends(get_db)):
    services = _seed_defaults_if_empty(db)
    return [_format_service(s) for s in services]


@router.get("/{service_id}", response_model=ServiceOut)
def get_service_detail(service_id: str, db: Session = Depends(get_db)):
    try:
        sid = uuid.UUID(service_id)
        svc = db.query(Service).filter(Service.id == sid).first()
    except Exception:
        svc = db.query(Service).first()

    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")

    return _format_service(svc)


@router.post("", response_model=ServiceOut)
def create_service(req: ServiceCreate, db: Session = Depends(get_db)):
    svc = Service(
        name=req.name,
        base_rate=req.base_rate,
        unit=req.unit,
        requires_height_category=req.requires_height_category,
        description=req.desc,
        icon=req.icon or "🌴",
        image_url=req.image_url or req.image,
        status=req.status or "active"
    )
    db.add(svc)
    db.commit()
    db.refresh(svc)
    record_audit_log(
        db,
        actor="Platform Administrator (admin)",
        action="Updated Service Base Rate",
        target=f"{svc.name}",
        details=f"Rate set to ₹{float(svc.base_rate):.2f} / {svc.unit}. Height required: {bool(svc.requires_height_category)}."
    )
    return _format_service(svc)


@router.put("/{service_id}", response_model=ServiceOut)
def update_service(service_id: str, req: ServiceUpdate, db: Session = Depends(get_db)):
    try:
        sid = uuid.UUID(service_id)
        svc = db.query(Service).filter(Service.id == sid).first()
    except Exception:
        svc = None

    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")

    if req.name is not None:
        svc.name = req.name
    if req.base_rate is not None:
        svc.base_rate = req.base_rate
    if req.unit is not None:
        svc.unit = req.unit
    if req.requires_height_category is not None:
        svc.requires_height_category = req.requires_height_category
    if req.desc is not None:
        svc.description = req.desc
    if req.icon is not None:
        svc.icon = req.icon
    if req.image_url is not None or req.image is not None:
        svc.image_url = req.image_url or req.image
    if req.status is not None:
        svc.status = req.status

    db.commit()
    db.refresh(svc)
    record_audit_log(
        db,
        actor="Platform Administrator (admin)",
        action="Updated Service Base Rate",
        target=f"{svc.name}",
        details=f"Rate set to ₹{float(svc.base_rate):.2f} / {svc.unit}. Height required: {bool(svc.requires_height_category)}."
    )
    return _format_service(svc)


@router.patch("/{service_id}/status")
def update_service_status(service_id: str, data: dict, db: Session = Depends(get_db)):
    try:
        sid = uuid.UUID(service_id)
        svc = db.query(Service).filter(Service.id == sid).first()
    except Exception:
        svc = None

    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")

    new_status = data.get("status", "active")
    svc.status = new_status
    db.commit()
    return {"success": True, "service_id": service_id, "status": new_status}


@router.delete("/{service_id}")
def delete_service(service_id: str, db: Session = Depends(get_db)):
    try:
        sid = uuid.UUID(service_id)
        svc = db.query(Service).filter(Service.id == sid).first()
    except Exception:
        svc = None

    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")

    db.delete(svc)
    db.commit()
    return {"success": True, "service_id": service_id}
