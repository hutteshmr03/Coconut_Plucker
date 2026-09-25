import uuid
from sqlalchemy import Column, String, DateTime, CheckConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('customer', 'professional', 'admin', 'super_admin')", name="users_role_check"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"), default=uuid.uuid4)
    phone = Column(String(15), unique=True, nullable=False, index=True)
    full_name = Column(String(120), nullable=False)
    role = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, server_default="active", default="active")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    # Relationships
    customer_profile = relationship("CustomerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    professional_profile = relationship("ProfessionalProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    customer_bookings = relationship("Booking", foreign_keys="Booking.customer_id", back_populates="customer")
    professional_bookings = relationship("Booking", foreign_keys="Booking.professional_id", back_populates="professional")
    reported_incidents = relationship("Incident", back_populates="reporter")
