from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def record_audit_log(db: Session, actor: str, action: str, target: str, details: str = "") -> None:
    """Safely record an audit log entry in MySQL without ever interrupting the caller."""
    try:
        entry = AuditLog(
            actor=actor[:160],
            action=action[:120],
            target=target[:160],
            details=details
        )
        db.add(entry)
        db.commit()
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass
