import uuid
from sqlalchemy import Column, String, Text, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"), default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    reported_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=False)
    photo_url = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, server_default="open", default="open")

    # Relationships
    booking = relationship("Booking", back_populates="incidents")
    reporter = relationship("User", back_populates="reported_incidents")
