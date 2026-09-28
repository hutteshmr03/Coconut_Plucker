import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_otp_request_endpoint(client):
    res = client.post("/api/auth/otp/request", json={"phone": "9842530001"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "9842530001" in data["message"]

def test_otp_verify_and_login(client):
    res = client.post("/api/auth/otp/verify", json={"phone": "9842530001", "otp": "1234"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["phone"] == "9842530001"

def test_user_registration_without_username_or_password(client):
    res = client.post("/api/auth/register", json={
        "full_name": "Test Farmer Customer",
        "phone": "9842530002",
        "role": "customer",
        "taluka": "South Goa",
        "address": "Margao, South Goa"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["phone"] == "9842530002"
    assert data["user"]["role"] == "customer"
    assert data["user"]["taluka"] == "South Goa"

def test_admin_login_with_username_and_phone(client):
    # Test login as admin
    res = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["role"] == "admin"

    # Test login as superadmin
    res_sa = client.post("/api/auth/login", json={"username": "superadmin", "password": "tempPassword123!"})
    assert res_sa.status_code == 200
    data_sa = res_sa.json()
    assert data_sa["user"]["role"] == "super_admin"

def test_regional_scheduling_and_availability(client):
    # Test North Goa availability
    res_north = client.get("/api/availability?taluka=North%20Goa")
    assert res_north.status_code == 200
    data_north = res_north.json()
    assert len(data_north["available_dates"]) > 0

    # Test South Goa availability
    res_south = client.get("/api/availability?taluka=South%20Goa")
    assert res_south.status_code == 200
    data_south = res_south.json()
    assert len(data_south["available_dates"]) > 0

    # Test Kushavati availability (Saturdays)
    res_kush = client.get("/api/availability?taluka=Kushavati")
    assert res_kush.status_code == 200
    data_kush = res_kush.json()
    assert len(data_kush["available_dates"]) > 0
    # Every date for standard Kushavati must be Saturday
    for d in data_kush["available_dates"]:
        assert d["day_name"] == "Saturday"

def test_super_admin_admin_provisioning_without_email(client):
    # Provision new admin without email
    res = client.post("/api/super-admin/admins", json={
        "full_name": "Test Regional Admin",
        "phone": "9842539999",
        "taluka": "South Goa",
        "password": "admin123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["phone"] == "9842539999"
    assert data["role"] == "admin"

def test_scheduling_config_endpoints(client):
    # Get active config
    res = client.get("/api/super-admin/scheduling-config")
    assert res.status_code == 200
    data = res.json()
    assert "north_days" in data
    assert "south_days" in data
    assert "kushavati_days" in data

    # Update active config
    res_update = client.put("/api/super-admin/scheduling-config", json={
        "north_days": ["Monday", "Tuesday", "Wednesday"],
        "south_days": ["Wednesday", "Thursday", "Friday"],
        "kushavati_days": ["Saturday"],
        "max_daily_slots": 20
    })
    assert res_update.status_code == 200
    updated_data = res_update.json()
    assert updated_data["success"] is True
    assert "Wednesday" in updated_data["config"]["south_days"]
