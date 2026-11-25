import uuid
from sqlalchemy import Column, String, Text, Numeric, Boolean, ForeignKey, text, Uuid
from sqlalchemy.orm import relationship
from app.core.database import Base


class Service(Base):
    __tablename__ = "services"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(80), nullable=False)
    base_rate = Column(Numeric(8, 2), nullable=False)
    unit = Column(String(20), nullable=False)
    requires_height_category = Column(Boolean, nullable=False, default=False)
    description = Column(Text, nullable=True)
    icon = Column(String(32), nullable=True, default="🌴")
    status = Column(String(20), nullable=True, default="active")
    image_url = Column(Text, nullable=True)

    # Relationships
    professional_skills = relationship("ProfessionalSkill", back_populates="service", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="service")


class ProfessionalSkill(Base):
    __tablename__ = "professional_skills"

    professional_id = Column(Uuid(as_uuid=True), ForeignKey("professional_profiles.user_id", ondelete="CASCADE"), primary_key=True)
    service_id = Column(Uuid(as_uuid=True), ForeignKey("services.id", ondelete="CASCADE"), primary_key=True)

    # Relationships
    professional = relationship("ProfessionalProfile", back_populates="skills")
    service = relationship("Service", back_populates="professional_skills")
