from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import UserOut
from app.routers.auth import format_user_out

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("/me", response_model=UserOut)
def get_customer_me(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.role == "customer").first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    return format_user_out(user, db)
