import uuid
from sqlalchemy import Column, String, Numeric, Boolean, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Service(Base):
    __tablename__ = "services"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"), default=uuid.uuid4)
    name = Column(String(80), nullable=False)
    base_rate = Column(Numeric(8, 2), nullable=False)
    unit = Column(String(20), nullable=False)
    requires_height_category = Column(Boolean, nullable=False, server_default=text("false"), default=False)

    # Relationships
    professional_skills = relationship("ProfessionalSkill", back_populates="service", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="service")


class ProfessionalSkill(Base):
    __tablename__ = "professional_skills"

    professional_id = Column(UUID(as_uuid=True), ForeignKey("professional_profiles.user_id", ondelete="CASCADE"), primary_key=True)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id", ondelete="CASCADE"), primary_key=True)

    # Relationships
    professional = relationship("ProfessionalProfile", back_populates="skills")
    service = relationship("Service", back_populates="professional_skills")
