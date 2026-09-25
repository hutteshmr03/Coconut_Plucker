import uuid
from sqlalchemy import Column, String, Numeric, DateTime, CheckConstraint, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint(
            "height_category IS NULL OR height_category IN ('low', 'medium', 'high')",
            name="bookings_height_category_check"
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"), default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    professional_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id", ondelete="SET NULL"), nullable=True)
    height_category = Column(String(20), nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), nullable=False, server_default="requested", default="requested")
    quote_amount = Column(Numeric(8, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id], back_populates="customer_bookings")
    professional = relationship("User", foreign_keys=[professional_id], back_populates="professional_bookings")
    service = relationship("Service", back_populates="bookings")
    payment = relationship("Payment", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    review = relationship("Review", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="booking", cascade="all, delete-orphan")
