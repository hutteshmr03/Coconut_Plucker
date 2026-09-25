import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text, inspect
from app.main import app
from app.core.database import engine, SessionLocal
from app.models import (
    User,
    CustomerProfile,
    ProfessionalProfile,
    Service,
    ProfessionalSkill,
    Booking,
    Payment,
    Review,
    Incident,
)


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_health_check_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Coconut Plucker API" in data["message"]


def test_database_tables_exist(db_session):
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    
    expected_tables = {
        "users",
        "customer_profiles",
        "professional_profiles",
        "services",
        "professional_skills",
        "bookings",
        "payments",
        "reviews",
        "incidents",
        "alembic_version",
    }
    
    for table in expected_tables:
        assert table in existing_tables, f"Table {table} does not exist in database"


def test_table_primary_and_foreign_keys():
    inspector = inspect(engine)
    
    # Check users PK
    users_pk = inspector.get_pk_constraint("users")
    assert users_pk["constrained_columns"] == ["id"]
    
    # Check customer_profiles PK & FK
    cust_pk = inspector.get_pk_constraint("customer_profiles")
    assert cust_pk["constrained_columns"] == ["user_id"]
    cust_fks = inspector.get_foreign_keys("customer_profiles")
    assert any(fk["referred_table"] == "users" for fk in cust_fks)

    # Check professional_profiles PK & FK
    pro_pk = inspector.get_pk_constraint("professional_profiles")
    assert pro_pk["constrained_columns"] == ["user_id"]
    pro_fks = inspector.get_foreign_keys("professional_profiles")
    assert any(fk["referred_table"] == "users" for fk in pro_fks)

    # Check professional_skills composite PK & FKs
    skills_pk = inspector.get_pk_constraint("professional_skills")
    assert set(skills_pk["constrained_columns"]) == {"professional_id", "service_id"}

    # Check bookings PK & FKs
    bookings_pk = inspector.get_pk_constraint("bookings")
    assert bookings_pk["constrained_columns"] == ["id"]
    bookings_fks = inspector.get_foreign_keys("bookings")
    ref_tables = {fk["referred_table"] for fk in bookings_fks}
    assert "users" in ref_tables
    assert "services" in ref_tables


def test_check_constraints_and_defaults(db_session):
    # Test valid user role creation and rollback
    try:
        test_user = User(
            phone="+919876543210",
            full_name="Test User",
            role="customer",
            status="active"
        )
        db_session.add(test_user)
        db_session.commit()
        db_session.refresh(test_user)

        assert test_user.id is not None
        assert test_user.role == "customer"
        assert test_user.status == "active"
        assert test_user.created_at is not None

        # Clean up
        db_session.delete(test_user)
        db_session.commit()
    except Exception:
        db_session.rollback()
        raise
