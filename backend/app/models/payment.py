import uuid
from sqlalchemy import Column, String, Numeric, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"), default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(8, 2), nullable=False)
    provider_ref = Column(String(80), nullable=True)
    status = Column(String(20), nullable=False, server_default="pending", default="pending")

    # Relationships
    booking = relationship("Booking", back_populates="payment")
