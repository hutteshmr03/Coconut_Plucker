from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class ProfessionalProfile(Base):
    __tablename__ = "professional_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    experience_years = Column(Integer, nullable=True)
    safety_cert = Column(String(80), nullable=True)
    rating_avg = Column(Numeric(2, 1), server_default=text("0"), default=0.0)
    taluka = Column(String(80), nullable=False)

    # Relationships
    user = relationship("User", back_populates="professional_profile")
    skills = relationship("ProfessionalSkill", back_populates="professional", cascade="all, delete-orphan")
