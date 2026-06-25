"""Iteration 2 — phone auth, saved addresses, coupons, offers in /config, coupon discount in orders."""
import os
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
def phone_user():
    phone = f"9{uuid.uuid4().int % 10**9:09d}"
    r = requests.post(f"{API}/auth/register", json={"name": "Phone User", "phone": phone, "password": "Test@123"})
    assert r.status_code == 200, r.text
    body = r.json()
    return {"phone": phone, "token": body["token"], "user": body["user"]}


# ---------- Auth: phone-only register & login ----------
def test_register_with_phone_only(phone_user):
    assert phone_user["token"]
    assert phone_user["user"]["phone"] == phone_user["phone"]
    # role customer
    assert phone_user["user"]["role"] == "customer"


def test_login_with_phone(phone_user):
    r = requests.post(f"{API}/auth/login", json={"identifier": phone_user["phone"], "password": "Test@123"})
    assert r.status_code == 200, r.text
    assert r.json()["user"]["phone"] == phone_user["phone"]


def test_duplicate_phone_register_fails(phone_user):
    r = requests.post(f"{API}/auth/register", json={"name": "Dup", "phone": phone_user["phone"], "password": "Test@123"})
    assert r.status_code == 400


def test_short_phone_rejected():
    r = requests.post(f"{API}/auth/register", json={"name": "Short", "phone": "123", "password": "Test@123"})
    assert r.status_code == 400


# ---------- Addresses ----------
def _addr_payload():
    return {
        "full_name": "Addr Buyer",
        "phone": "9123456789",
        "line1": "12 Test Lane",
        "line2": "Apt 5",
        "city": "Akola",
        "state": "MH",
        "pincode": "443101",
        "landmark": "Near temple",
    }


def test_addresses_crud(phone_user):
    h = {"Authorization": f"Bearer {phone_user['token']}"}
    # GET empty initially
    r = requests.get(f"{API}/me/addresses", headers=h)
    assert r.status_code == 200
    assert r.json() == []

    # POST
    r2 = requests.post(f"{API}/me/addresses", json=_addr_payload(), headers=h)
    assert r2.status_code == 200, r2.text
    saved = r2.json()
    assert "address_id" in saved
    assert saved["city"] == "Akola"

    # GET returns one
    r3 = requests.get(f"{API}/me/addresses", headers=h)
    assert r3.status_code == 200
    lst = r3.json()
    assert len(lst) == 1 and lst[0]["address_id"] == saved["address_id"]

    # DELETE
    r4 = requests.delete(f"{API}/me/addresses/{saved['address_id']}", headers=h)
    assert r4.status_code == 200

    # GET empty after delete
    r5 = requests.get(f"{API}/me/addresses", headers=h)
    assert r5.json() == []


def test_addresses_requires_auth():
    r = requests.get(f"{API}/me/addresses")
    assert r.status_code == 401


# ---------- Coupon CRUD ----------
@pytest.fixture(scope="session")
def coupon_state():
    return {}


def test_admin_create_coupon(admin_token, coupon_state):
    h = {"Authorization": f"Bearer {admin_token}"}
    code = f"TEST{uuid.uuid4().hex[:5].upper()}"
    body = {"code": code, "type": "percent", "value": 20, "description": "Test diwali", "active": True, "public": True}
    r = requests.post(f"{API}/admin/coupons", json=body, headers=h)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["code"] == code  # uppercase
    assert j["type"] == "percent"
    assert j["value"] == 20
    assert "coupon_id" in j
    coupon_state["coupon"] = j


def test_admin_list_coupons(admin_token, coupon_state):
    h = {"Authorization": f"Bearer {admin_token}"}
    r = requests.get(f"{API}/admin/coupons", headers=h)
    assert r.status_code == 200
    codes = [c["code"] for c in r.json()]
    assert coupon_state["coupon"]["code"] in codes


def test_admin_update_coupon(admin_token, coupon_state):
    h = {"Authorization": f"Bearer {admin_token}"}
    c = coupon_state["coupon"]
    body = {"code": c["code"], "type": "percent", "value": 25, "description": "updated", "active": True, "public": True}
    r = requests.put(f"{API}/admin/coupons/{c['coupon_id']}", json=body, headers=h)
    assert r.status_code == 200
    assert r.json()["value"] == 25
    coupon_state["coupon"] = r.json()


def test_public_coupon_lookup_active(coupon_state):
    c = coupon_state["coupon"]
    r = requests.get(f"{API}/coupons/{c['code']}")
    assert r.status_code == 200
    assert r.json()["code"] == c["code"]


def test_public_coupon_lookup_inactive_returns_404(admin_token, coupon_state):
    # Deactivate
    h = {"Authorization": f"Bearer {admin_token}"}
    c = coupon_state["coupon"]
    body = {"code": c["code"], "type": "percent", "value": c["value"], "description": "", "active": False, "public": True}
    rput = requests.put(f"{API}/admin/coupons/{c['coupon_id']}", json=body, headers=h)
    assert rput.status_code == 200
    # Lookup should 404
    r = requests.get(f"{API}/coupons/{c['code']}")
    assert r.status_code == 404
    # Re-activate for downstream tests
    body["active"] = True
    requests.put(f"{API}/admin/coupons/{c['coupon_id']}", json=body, headers=h)


def test_config_returns_active_public_offers(coupon_state):
    r = requests.get(f"{API}/config")
    assert r.status_code == 200
    cfg = r.json()
    assert "offers" in cfg
    codes = [o["code"] for o in cfg["offers"]]
    assert coupon_state["coupon"]["code"] in codes


# ---------- Order with coupon ----------
def test_order_with_percent_coupon(phone_user, coupon_state):
    pid = requests.get(f"{API}/products").json()[0]["product_id"]
    code = coupon_state["coupon"]["code"]
    body = {
        "address": {"full_name": "Buyer", "phone": "9123456789", "line1": "1 St", "city": "Akola", "state": "MH", "pincode": "443101"},
        "payment_method": "cod",
        "items": [{"product_id": pid, "quantity": 1}],
        "coupon_code": code,
    }
    h = {"Authorization": f"Bearer {phone_user['token']}"}
    r = requests.post(f"{API}/orders", json=body, headers=h)
    assert r.status_code == 200, r.text
    order = r.json()
    assert order["coupon_code"] == code
    assert order["discount"] > 0
    # Sanity: subtotal*0.25 ≈ discount
    expected = round(order["subtotal"] * 0.25, 2)
    assert abs(order["discount"] - expected) < 0.01
    assert order["total"] == order["subtotal"] + order["shipping"] - order["discount"]


def test_admin_delete_coupon(admin_token, coupon_state):
    h = {"Authorization": f"Bearer {admin_token}"}
    c = coupon_state["coupon"]
    r = requests.delete(f"{API}/admin/coupons/{c['coupon_id']}", headers=h)
    assert r.status_code == 200
    # public lookup should now 404
    r2 = requests.get(f"{API}/coupons/{c['code']}")
    assert r2.status_code == 404
