import uuid
from sqlalchemy import Column, Integer, Text, CheckConstraint, ForeignKey, text, Uuid
from sqlalchemy.orm import relationship
from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="reviews_rating_check"),
    )

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(Uuid(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)

    # Relationships
    booking = relationship("Booking", back_populates="review")
