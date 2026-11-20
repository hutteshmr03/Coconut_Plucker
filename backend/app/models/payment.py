import uuid
from sqlalchemy import Column, String, Numeric, ForeignKey, text, Uuid
from sqlalchemy.orm import relationship
from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(Uuid(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(8, 2), nullable=False)
    payment_method = Column(String(30), nullable=True)
    provider_ref = Column(String(80), nullable=True)
    status = Column(String(20), nullable=False, server_default="pending", default="pending", index=True)

    # Relationships
    booking = relationship("Booking", back_populates="payment")
