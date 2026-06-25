"""Sejal Creation backend API tests"""
import os
import base64
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://luxury-adornments-17.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/admin-login", json={"identifier": "sejal2402", "password": "Adishakti"})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def customer():
    email = f"TEST_user_{uuid.uuid4().hex[:6]}@test.com"
    phone = f"9{uuid.uuid4().int % 10**9:09d}"
    r = requests.post(f"{API}/auth/register", json={"name": "Test User", "email": email, "password": "Pass@123", "phone": phone})
    assert r.status_code == 200, r.text
    return {"email": email, "token": r.json()["token"], "password": "Pass@123"}


# -- Products & categories
def test_products_list():
    r = requests.get(f"{API}/products")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 10


def test_categories():
    r = requests.get(f"{API}/categories")
    assert r.status_code == 200
    assert len(r.json()) == 14


def test_product_detail():
    pid = requests.get(f"{API}/products").json()[0]["product_id"]
    r = requests.get(f"{API}/products/{pid}")
    assert r.status_code == 200
    body = r.json()
    assert "product" in body and "related" in body and "reviews" in body


# -- Auth
def test_login_with_new_user(customer):
    r = requests.post(f"{API}/auth/login", json={"identifier": customer["email"], "password": customer["password"]})
    assert r.status_code == 200


def test_auth_me(customer):
    r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {customer['token']}"})
    assert r.status_code == 200
    assert r.json()["email"] == customer["email"]


def test_admin_login(admin_token):
    assert admin_token


def test_non_admin_403(customer):
    r = requests.get(f"{API}/admin/dashboard", headers={"Authorization": f"Bearer {customer['token']}"})
    assert r.status_code == 403


# -- Pincode
def test_pincode_cod_yes():
    r = requests.get(f"{API}/check-pincode", params={"pincode": "443101"})
    assert r.status_code == 200 and r.json()["cod_available"] is True


def test_pincode_cod_no():
    r = requests.get(f"{API}/check-pincode", params={"pincode": "400001"})
    assert r.status_code == 200 and r.json()["cod_available"] is False


# -- Orders
def _addr(pincode):
    return {"full_name": "Test Buyer", "phone": "9999999999", "line1": "1 Test St", "city": "Akola", "state": "MH", "pincode": pincode}


def test_cod_rejected_non_cod_pin():
    pid = requests.get(f"{API}/products").json()[0]["product_id"]
    body = {"address": _addr("400001"), "payment_method": "cod", "items": [{"product_id": pid, "quantity": 1}]}
    r = requests.post(f"{API}/orders", json=body)
    assert r.status_code == 400


def test_qr_order_with_proof(customer):
    pid = requests.get(f"{API}/products").json()[0]["product_id"]
    proof = base64.b64encode(b"fakeimg").decode()
    body = {"address": _addr("400001"), "payment_method": "qr", "items": [{"product_id": pid, "quantity": 2}], "payment_proof": proof}
    r = requests.post(f"{API}/orders", json=body, headers={"Authorization": f"Bearer {customer['token']}"})
    assert r.status_code == 200, r.text
    assert "order_id" in r.json()


# -- Admin
def test_admin_dashboard(admin_token):
    r = requests.get(f"{API}/admin/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    d = r.json()
    for k in ["total_sales", "total_orders", "best_selling", "sales_7d"]:
        assert k in d


def test_admin_orders_list(admin_token):
    r = requests.get(f"{API}/admin/orders", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200 and isinstance(r.json(), list)


def test_admin_update_order_status(admin_token, customer):
    pid = requests.get(f"{API}/products").json()[0]["product_id"]
    body = {"address": _addr("443101"), "payment_method": "cod", "items": [{"product_id": pid, "quantity": 1}]}
    o = requests.post(f"{API}/orders", json=body, headers={"Authorization": f"Bearer {customer['token']}"}).json()
    r = requests.put(f"{API}/admin/orders/{o['order_id']}/status", json={"status": "Shipped"}, headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    fetched = requests.get(f"{API}/orders/{o['order_id']}").json()
    assert fetched["status"] == "Shipped"
    assert any(t["status"] == "Shipped" for t in fetched["tracking"])


# -- Product CRUD admin
def test_admin_product_crud(admin_token):
    h = {"Authorization": f"Bearer {admin_token}"}
    body = {"name": "TEST_Product", "description": "x", "category": "Earrings", "price": 100, "images": ["http://i"]}
    r = requests.post(f"{API}/products", json=body, headers=h)
    assert r.status_code == 200
    pid = r.json()["product_id"]
    body["price"] = 200
    r2 = requests.put(f"{API}/products/{pid}", json=body, headers=h)
    assert r2.status_code == 200 and r2.json()["price"] == 200
    r3 = requests.delete(f"{API}/products/{pid}", headers=h)
    assert r3.status_code == 200
    r4 = requests.get(f"{API}/products/{pid}")
    assert r4.status_code == 404


# -- Rental
def test_rental_booking():
    rentals = [p for p in requests.get(f"{API}/products").json() if p.get("is_rental")]
    assert rentals
    body = {"product_id": rentals[0]["product_id"], "start_date": "2026-02-01", "end_date": "2026-02-05", "address": _addr("443101"), "payment_proof": base64.b64encode(b"x").decode()}
    r = requests.post(f"{API}/rentals", json=body)
    assert r.status_code == 200
    j = r.json()
    assert j["type"] == "rental" and j["order_id"].startswith("RNT-")


def test_google_session_fake_401():
    r = requests.post(f"{API}/auth/google-session", json={"session_id": "fake"})
    assert r.status_code == 401
