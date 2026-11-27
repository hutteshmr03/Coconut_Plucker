import hashlib
import hmac
import os
import uuid
import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("DEFAULT_ADMIN_PASSWORD", "test-adm-secret-1")
os.environ.setdefault("DEFAULT_SUPER_ADMIN_PASSWORD", "test-sa-secret-2")

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.email import format_booking_email_html
from app.main import app
from app.models.service import Service


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def _register_or_login_customer(client: TestClient, phone: str, name: str):
    res = client.post(
        "/api/auth/register",
        json={
            "full_name": name,
            "phone": phone,
            "role": "customer",
            "taluka": "North Goa",
            "address": "Panaji, North Goa",
        },
    )
    if res.status_code == 200:
        return res.json()
    res = client.post("/api/auth/login", json={"phone": phone})
    assert res.status_code == 200
    return res.json()


def test_path_traversal_and_dotfile_blocked(client):
    for path in ["/.env", "/..%2F..%2Fbackend/.env", "/backend/.env", "/.git/config"]:
        res = client.get(path)
        assert res.status_code in (403, 404)
        assert "DATABASE_URL" not in res.text
        assert "SECRET_KEY" not in res.text


def test_unauthenticated_endpoints_rejected(client):
    assert client.get("/api/bookings/test-email").status_code == 401
    assert client.post("/api/bookings/test-email").status_code == 401
    assert client.post("/api/bookings/notify-email", json={"order_id": "X"}).status_code == 401
    assert client.get("/api/bookings").status_code == 401
    assert client.post("/api/bookings", json={"service_id": "x", "taluka": "North Goa", "address": "Goa", "scheduled_at": "2026-12-01T09:00:00Z"}).status_code == 401
    assert client.get("/api/customers/me").status_code == 401
    assert client.get("/api/professionals/me").status_code == 401
    assert client.get("/api/services/admin").status_code == 401
    assert client.get("/api/auth/me").status_code == 401


def test_role_escalation_and_duplicate_phone_blocked(client):
    res_admin_reg = client.post(
        "/api/auth/register",
        json={"full_name": "Attacker", "phone": "9811112222", "role": "admin"},
    )
    assert res_admin_reg.status_code == 403

    first = _register_or_login_customer(client, "9811113333", "Customer One")
    assert first["user"]["phone"] == "9811113333"

    dup = client.post(
        "/api/auth/register",
        json={"full_name": "Hijacker", "phone": "9811113333", "role": "customer"},
    )
    assert dup.status_code in (400, 409)


def _ensure_service_id() -> str:
    db = SessionLocal()
    try:
        svc = db.query(Service).filter(Service.status != "inactive").first()
        if not svc:
            svc = Service(name="Coconut Plucking", base_rate=100.0, unit="tree", status="active")
            db.add(svc)
            db.commit()
            db.refresh(svc)
        return str(svc.id)
    finally:
        db.close()


def test_booking_ownership_and_no_first_fallback(client):
    c1 = _register_or_login_customer(client, "9811114444", "Owner Customer")
    c2 = _register_or_login_customer(client, "9811115555", "Other Customer")
    h1 = {"Authorization": f"Bearer {c1['access_token']}"}
    h2 = {"Authorization": f"Bearer {c2['access_token']}"}

    svc_id = _ensure_service_id()

    # Unknown service must return 404 (not silently fall back to first service)
    bad_svc = client.post(
        "/api/bookings/quote",
        json={"service_id": str(uuid.uuid4()), "tree_count": 2, "booking_type": "standard"},
    )
    assert bad_svc.status_code == 404

    # Invalid booking ID must return 404 (not fall back to first booking)
    assert client.get("/api/bookings/not-a-uuid", headers=h1).status_code == 404

    # Create booking as Owner Customer
    bk_res = client.post(
        "/api/bookings",
        headers=h1,
        json={
            "service_id": svc_id,
            "tree_count": 2,
            "taluka": "North Goa",
            "address": "Mapusa, North Goa",
            "scheduled_at": "2026-12-01T09:00:00Z",
            "booking_type": "urgent",
        },
    )
    assert bk_res.status_code == 200
    bk = bk_res.json()

    # Cross-customer access must return 403
    assert client.get(f"/api/bookings/{bk['id']}", headers=h2).status_code == 403

    # Verify urgent 20% surcharge parity between /quote and POST /bookings
    q_res = client.post(
        "/api/bookings/quote",
        json={"service_id": svc_id, "tree_count": 2, "booking_type": "urgent"},
    )
    assert q_res.status_code == 200
    q = q_res.json()
    assert round(q["base_amount"] * 0.20, 2) == q["surcharge_amount"]
    assert q["quote_amount"] == bk["quote_amount"]


def test_razorpay_hmac_verification_enforced(client, monkeypatch):
    c1 = _register_or_login_customer(client, "9811116666", "Payment Tester")
    headers = {"Authorization": f"Bearer {c1['access_token']}"}

    svc_id = _ensure_service_id()

    monkeypatch.setattr(settings, "RAZORPAY_KEY_SECRET", "rzp_test_secret_12345")

    # Missing signature rejected
    missing_res = client.post(
        "/api/bookings",
        headers=headers,
        json={
            "service_id": svc_id,
            "tree_count": 1,
            "taluka": "North Goa",
            "address": "Panaji",
            "scheduled_at": "2026-12-01T09:00:00Z",
            "razorpay_payment_id": "pay_fake123",
        },
    )
    assert missing_res.status_code == 400

    # Tampered signature rejected
    bad_sig_res = client.post(
        "/api/bookings",
        headers=headers,
        json={
            "service_id": svc_id,
            "tree_count": 1,
            "taluka": "North Goa",
            "address": "Panaji",
            "scheduled_at": "2026-12-01T09:00:00Z",
            "razorpay_order_id": "order_123",
            "razorpay_payment_id": "pay_123",
            "razorpay_signature": "bad_sig_deadbeef",
        },
    )
    assert bad_sig_res.status_code == 400

    # Valid HMAC-SHA256 signature accepted and marked paid
    order_id = "order_valid_123"
    payment_id = "pay_valid_456"
    valid_sig = hmac.new(
        b"rzp_test_secret_12345",
        f"{order_id}|{payment_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    ok_res = client.post(
        "/api/bookings",
        headers=headers,
        json={
            "service_id": svc_id,
            "tree_count": 1,
            "taluka": "North Goa",
            "address": "Panaji",
            "scheduled_at": "2026-12-01T09:00:00Z",
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": valid_sig,
        },
    )
    assert ok_res.status_code == 200
    assert ok_res.json()["payment_status"] == "paid"


def test_email_html_escapes_user_fields():
    rendered = format_booking_email_html({
        "order_id": "CP-999",
        "customer_name": "<script>alert(1)</script>",
        "address": "123 <b>Street</b>",
        "hazard_notes": "<img src=x onerror=alert('xss')>",
    })
    assert "<script>alert(1)</script>" not in rendered
    assert "&lt;script&gt;alert(1)&lt;/script&gt;" in rendered
    assert "<img src=x onerror=" not in rendered
    assert "&lt;img src=x onerror=alert(&#x27;xss&#x27;)&gt;" in rendered


def test_customer_multi_taluka_addresses_persist_in_db(client):
    c1 = _register_or_login_customer(client, "9811117777", "Address Persistence User")
    headers = {"Authorization": f"Bearer {c1['access_token']}"}

    put_res = client.put(
        "/api/customers/me",
        headers=headers,
        json={
            "full_name": "Address Persistence User",
            "phone": "9811117777",
            "taluka": "North Goa",
            "address": "Mapusa Primary House",
            "addresses": ["Mapusa Primary House", "Margao Farm Plot"],
            "addresses_by_taluka": {
                "North Goa": ["Mapusa Primary House"],
                "South Goa": ["Margao Farm Plot"],
            },
        },
    )
    assert put_res.status_code == 200
    assert put_res.json()["addresses_by_taluka"]["South Goa"] == ["Margao Farm Plot"]

    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["addresses"] == ["Mapusa Primary House", "Margao Farm Plot"]
    assert me_res.json()["addresses_by_taluka"]["South Goa"] == ["Margao Farm Plot"]


def test_get_db_retries_transient_operational_error(monkeypatch):
    from sqlalchemy.exc import OperationalError
    import app.core.database as db_mod

    attempts = {"count": 0}
    closed = {"count": 0}

    class FakeSession:
        def execute(self, *_args, **_kwargs):
            attempts["count"] += 1
            if attempts["count"] < 2:
                raise OperationalError("SELECT 1", {}, Exception("1040 Too many connections"))
            return 1

        def close(self):
            closed["count"] += 1

    monkeypatch.setattr(db_mod, "SessionLocal", lambda: FakeSession())
    monkeypatch.setattr(db_mod, "init_tables_safely", lambda: None)
    monkeypatch.setattr(db_mod.time, "sleep", lambda _s: None)

    gen = db_mod.get_db()
    sess = next(gen)
    assert isinstance(sess, FakeSession)
    assert attempts["count"] == 2
    try:
        next(gen)
    except StopIteration:
        pass
    assert closed["count"] == 2
