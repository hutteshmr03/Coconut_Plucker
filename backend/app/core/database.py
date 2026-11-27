import time
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
from app.core.config import settings

db_url = settings.DATABASE_URL.strip() if settings.DATABASE_URL else ""
if not db_url:
    # Safe local fallback until user configures MilesWeb MySQL
    db_url = "sqlite:///./paddeli.db"

if db_url.startswith("sqlite"):
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False}
    )
else:
    # Use NullPool on shared MySQL hosting so idle Passenger/LiteSpeed workers hold 0 open connections
    engine = create_engine(
        db_url,
        poolclass=NullPool,
        connect_args={"connect_timeout": 5}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

_tables_checked = False

def init_tables_safely():
    global _tables_checked
    if not _tables_checked:
        try:
            Base.metadata.create_all(bind=engine)
            # Safely ensure required columns exist on all databases
            alter_statements = [
                "ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)",
                "ALTER TABLE payments ADD COLUMN payment_method VARCHAR(30)",
                "ALTER TABLE services ADD COLUMN description TEXT",
                "ALTER TABLE services ADD COLUMN icon VARCHAR(32)",
                "ALTER TABLE services ADD COLUMN status VARCHAR(20) DEFAULT 'active'",
                "ALTER TABLE services ADD COLUMN image_url MEDIUMTEXT",
                "ALTER TABLE services MODIFY COLUMN icon VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
                "UPDATE services SET icon = NULL WHERE icon LIKE '%?%'",
                "ALTER TABLE bookings ADD COLUMN booking_number VARCHAR(40)",
                "ALTER TABLE bookings ADD COLUMN service_name VARCHAR(160)",
                "ALTER TABLE bookings ADD COLUMN tree_count INT DEFAULT 1",
                "ALTER TABLE bookings ADD COLUMN taluka VARCHAR(80)",
                "ALTER TABLE bookings ADD COLUMN address TEXT",
                "ALTER TABLE bookings ADD COLUMN booking_type VARCHAR(20) DEFAULT 'standard'",
                "ALTER TABLE bookings ADD COLUMN call_confirmed TINYINT(1) DEFAULT 1",
                "ALTER TABLE bookings ADD COLUMN hazard_notes TEXT",
                "ALTER TABLE bookings ADD COLUMN tree_photo MEDIUMTEXT",
                "ALTER TABLE bookings ADD COLUMN completed_at DATETIME NULL",
                "UPDATE bookings SET completed_at = UTC_TIMESTAMP() WHERE status = 'completed' AND completed_at IS NULL",
                "ALTER TABLE incidents MODIFY COLUMN booking_id CHAR(36) NULL",
                "ALTER TABLE incidents ADD COLUMN reported_by_name VARCHAR(120)",
                "ALTER TABLE incidents ADD COLUMN incident_type VARCHAR(60) DEFAULT 'Near-miss'",
                "ALTER TABLE incidents ADD COLUMN severity VARCHAR(20) DEFAULT 'low'",
                "ALTER TABLE incidents ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
                "ALTER TABLE professional_profiles ADD COLUMN insurance_cover TINYINT(1) DEFAULT 0",
                "ALTER TABLE professional_profiles ADD COLUMN insurance_cover_img MEDIUMTEXT",
                "ALTER TABLE customer_profiles ADD COLUMN addresses_json TEXT",
                "UPDATE users SET full_name = 'Chief Platform Admin' WHERE role = 'super_admin' AND full_name = 'Chief Platform Administrator'",
                "UPDATE audit_logs SET actor = REPLACE(actor, 'Chief Platform Administrator', 'Chief Platform Admin'), target = REPLACE(target, 'Chief Platform Administrator', 'Chief Platform Admin') WHERE actor LIKE '%Chief Platform Administrator%' OR target LIKE '%Chief Platform Administrator%'",
            ]
            with engine.connect() as conn:
                for stmt in alter_statements:
                    if db_url.startswith("sqlite") and ("MODIFY COLUMN" in stmt or "MEDIUMTEXT" in stmt or "TINYINT" in stmt or "UTC_TIMESTAMP()" in stmt):
                        stmt = stmt.replace("MEDIUMTEXT", "TEXT").replace("TINYINT(1)", "BOOLEAN").replace("UTC_TIMESTAMP()", "CURRENT_TIMESTAMP")
                        if "MODIFY COLUMN" in stmt:
                            continue
                    try:
                        conn.execute(text(stmt))
                        conn.commit()
                    except Exception:
                        pass
            _tables_checked = True
        except Exception as e:
            print(f"Table init notice: {e}")

def get_db():
    init_tables_safely()
    db = None
    last_err = None
    for attempt in range(3):
        candidate = SessionLocal()
        try:
            candidate.execute(text("SELECT 1"))
            db = candidate
            break
        except OperationalError as exc:
            last_err = exc
            candidate.close()
            if attempt < 2:
                time.sleep(0.3 * (attempt + 1))
    if db is None:
        raise last_err
    try:
        yield db
    finally:
        db.close()
