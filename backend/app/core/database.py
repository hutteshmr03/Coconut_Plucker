from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
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
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_recycle=300,
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
                "ALTER TABLE bookings ADD COLUMN booking_number VARCHAR(40)",
                "ALTER TABLE bookings ADD COLUMN service_name VARCHAR(160)",
                "ALTER TABLE bookings ADD COLUMN tree_count INT DEFAULT 1",
                "ALTER TABLE bookings ADD COLUMN taluka VARCHAR(80)",
                "ALTER TABLE bookings ADD COLUMN address TEXT",
                "ALTER TABLE bookings ADD COLUMN booking_type VARCHAR(20) DEFAULT 'standard'",
                "ALTER TABLE bookings ADD COLUMN call_confirmed TINYINT(1) DEFAULT 1",
                "ALTER TABLE bookings ADD COLUMN hazard_notes TEXT",
                "ALTER TABLE bookings ADD COLUMN tree_photo MEDIUMTEXT",
                "ALTER TABLE incidents MODIFY COLUMN booking_id CHAR(36) NULL",
                "ALTER TABLE incidents ADD COLUMN reported_by_name VARCHAR(120)",
                "ALTER TABLE incidents ADD COLUMN incident_type VARCHAR(60) DEFAULT 'Near-miss'",
                "ALTER TABLE incidents ADD COLUMN severity VARCHAR(20) DEFAULT 'low'",
                "ALTER TABLE incidents ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
            ]
            with engine.connect() as conn:
                for stmt in alter_statements:
                    if db_url.startswith("sqlite") and ("MODIFY COLUMN" in stmt or "MEDIUMTEXT" in stmt or "TINYINT" in stmt):
                        stmt = stmt.replace("MEDIUMTEXT", "TEXT").replace("TINYINT(1)", "BOOLEAN")
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
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
