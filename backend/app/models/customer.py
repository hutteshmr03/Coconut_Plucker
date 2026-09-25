from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class CustomerProfile(Base):
    __tablename__ = "customer_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    address = Column(Text, nullable=True)
    taluka = Column(String(80), nullable=False)

    # Relationships
    user = relationship("User", back_populates="customer_profile")
