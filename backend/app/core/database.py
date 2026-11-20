from sqlalchemy import create_engine
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
        pool_size=10,
        max_overflow=20,
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
