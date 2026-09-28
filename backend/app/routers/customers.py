from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import UserOut, UserUpdate
from app.routers.auth import format_user_out

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("/me", response_model=UserOut)
def get_customer_me(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.role == "customer").first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    return format_user_out(user, db)

@router.put("/me", response_model=UserOut)
def update_customer_me(req: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.role == "customer").first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if req.full_name is not None:
        user.full_name = req.full_name
    if req.phone is not None:
        user.phone = req.phone
    if req.email is not None:
        user.email = req.email
    if req.taluka is not None:
        user.taluka = req.taluka
    if req.address is not None:
        user.address = req.address

    db.commit()
    db.refresh(user)
    return format_user_out(user, db)
