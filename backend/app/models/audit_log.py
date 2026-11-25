import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, func, Uuid
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor = Column(String(160), nullable=False)
    action = Column(String(120), nullable=False, index=True)
    target = Column(String(160), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), default=lambda: datetime.now(timezone.utc), index=True)
