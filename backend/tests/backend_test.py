"""
Satthamma Farms — Round 2 backend tests
Focus:
 - Admin auth (cookie + JSON token)
 - Coupons CRUD + validate + role guard
 - Banners CRUD + kind filter + role guard
 - Orders with coupon_code (apply, invalid rejection, plain order still works)
 - Basic regression on product CRUD, order status update
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://earthly-eats-3.preview.emergentagent.com"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@satthammafarms.com"
ADMIN_PASS = "Admin@123"

# --------------- helpers / fixtures ---------------

def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=20)
    return r


@pytest.fixture(scope="session")
def admin_token():
    r = _login(ADMIN_EMAIL, ADMIN_PASS)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "admin"
    # HttpOnly cookie also set
    assert "access_token" in r.cookies, "access_token cookie not set"
    return data["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def customer_token():
    unique = uuid.uuid4().hex[:8]
    email = f"TEST_cust_{unique}@test.com"
    r = requests.post(f"{API}/auth/register", json={
        "name": "TEST Customer", "email": email, "password": "Customer@123", "phone": "+919000099999"
    }, timeout=20)
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    return r.json()["token"], email


@pytest.fixture(scope="session")
def customer_headers(customer_token):
    return {"Authorization": f"Bearer {customer_token[0]}", "Content-Type": "application/json"}


# --------------- Admin auth ---------------
class TestAuth:
    def test_admin_login_returns_cookie_and_role(self):
        r = _login(ADMIN_EMAIL, ADMIN_PASS)
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["email"] == ADMIN_EMAIL
        assert d["user"]["role"] == "admin"
        assert d["token"]
        assert "access_token" in r.cookies

    def test_admin_login_bad_password(self):
        r = _login(ADMIN_EMAIL, "wrong")
        assert r.status_code == 401


# --------------- Coupons CRUD & Validation ---------------
class TestCoupons:
    created_ids = []

    def test_admin_create_percent_coupon(self, admin_headers):
        code = f"TESTSAVE{uuid.uuid4().hex[:4].upper()}"
        payload = {"code": code, "type": "percent", "value": 10, "min_order": 100, "max_uses": 5, "active": True}
        r = requests.post(f"{API}/admin/coupons", json=payload, headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["code"] == code
        assert d["type"] == "percent"
        assert d["value"] == 10
        assert d["min_order"] == 100
        assert d["max_uses"] == 5
        assert d["active"] is True
        assert d["uses"] == 0
        TestCoupons.created_ids.append((d["id"], code))

    def test_admin_create_flat_coupon(self, admin_headers):
        code = f"TESTFLAT{uuid.uuid4().hex[:4].upper()}"
        payload = {"code": code, "type": "flat", "value": 50, "min_order": 0, "active": True}
        r = requests.post(f"{API}/admin/coupons", json=payload, headers=admin_headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["type"] == "flat"
        assert d["value"] == 50
        TestCoupons.created_ids.append((d["id"], code))

    def test_admin_list_coupons(self, admin_headers):
        r = requests.get(f"{API}/admin/coupons", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        codes = [c["code"] for c in arr]
        for _, code in TestCoupons.created_ids:
            assert code in codes

    def test_admin_coupons_non_admin_forbidden(self, customer_headers):
        r = requests.get(f"{API}/admin/coupons", headers=customer_headers, timeout=20)
        assert r.status_code == 403

    def test_admin_coupons_no_auth_unauthorized(self):
        r = requests.get(f"{API}/admin/coupons", timeout=20)
        assert r.status_code == 401

    def test_toggle_active_via_put(self, admin_headers):
        cid, code = TestCoupons.created_ids[0]
        # deactivate
        payload = {"code": code, "type": "percent", "value": 10, "min_order": 100, "max_uses": 5, "active": False}
        r = requests.put(f"{API}/admin/coupons/{cid}", json=payload, headers=admin_headers, timeout=20)
        assert r.status_code == 200
        assert r.json()["active"] is False
        # re-activate
        payload["active"] = True
        r2 = requests.put(f"{API}/admin/coupons/{cid}", json=payload, headers=admin_headers, timeout=20)
        assert r2.status_code == 200
        assert r2.json()["active"] is True

    def test_validate_percent_coupon(self):
        _cid, code = TestCoupons.created_ids[0]
        r = requests.post(f"{API}/coupons/validate", json={"code": code, "cart_total": 500}, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["discount_amount"] == 50.0  # 10% of 500
        assert d["new_total"] == 450.0

    def test_validate_flat_coupon(self):
        _cid, code = TestCoupons.created_ids[1]
        r = requests.post(f"{API}/coupons/validate", json={"code": code, "cart_total": 500}, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["discount_amount"] == 50.0
        assert d["new_total"] == 450.0

    def test_validate_min_order_not_met(self):
        _cid, code = TestCoupons.created_ids[0]
        r = requests.post(f"{API}/coupons/validate", json={"code": code, "cart_total": 50}, timeout=20)
        assert r.status_code == 400
        assert "Minimum" in r.json()["detail"] or "minimum" in r.json()["detail"].lower()

    def test_validate_unknown_code(self):
        r = requests.post(f"{API}/coupons/validate", json={"code": "NOSUCHCODEZZZ", "cart_total": 500}, timeout=20)
        assert r.status_code == 400
        assert "Invalid" in r.json()["detail"]

    def test_validate_inactive_coupon(self, admin_headers):
        # create an inactive coupon
        code = f"TESTOFF{uuid.uuid4().hex[:4].upper()}"
        create = requests.post(f"{API}/admin/coupons", json={
            "code": code, "type": "percent", "value": 10, "active": False
        }, headers=admin_headers, timeout=20)
        assert create.status_code == 200
        TestCoupons.created_ids.append((create.json()["id"], code))
        r = requests.post(f"{API}/coupons/validate", json={"code": code, "cart_total": 500}, timeout=20)
        assert r.status_code == 400
        assert "not active" in r.json()["detail"].lower()

    def test_validate_expired_coupon(self, admin_headers):
        code = f"TESTEXP{uuid.uuid4().hex[:4].upper()}"
        create = requests.post(f"{API}/admin/coupons", json={
            "code": code, "type": "percent", "value": 20, "active": True,
            "expires_at": "2020-01-01T00:00:00+00:00",
        }, headers=admin_headers, timeout=20)
        assert create.status_code == 200
        TestCoupons.created_ids.append((create.json()["id"], code))
        r = requests.post(f"{API}/coupons/validate", json={"code": code, "cart_total": 500}, timeout=20)
        assert r.status_code == 400
        assert "expired" in r.json()["detail"].lower()

    def test_zzz_delete_all_test_coupons(self, admin_headers):
        # runs after other tests due to name ordering
        for cid, _code in TestCoupons.created_ids:
            r = requests.delete(f"{API}/admin/coupons/{cid}", headers=admin_headers, timeout=20)
            assert r.status_code == 200
        # verify deletion by re-listing
        r = requests.get(f"{API}/admin/coupons", headers=admin_headers, timeout=20)
        remaining_codes = [c["code"] for c in r.json()]
        for _, code in TestCoupons.created_ids:
            assert code not in remaining_codes


# --------------- Banners CRUD ---------------
class TestBanners:
    created_ids = []

    def test_admin_create_slider_banner(self, admin_headers):
        payload = {
            "kind": "slider", "title": "TEST Slider", "subtitle": "test",
            "image_url": "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1200",
            "cta_label": "Shop", "cta_link": "/products", "active": True, "sort_order": 100
        }
        r = requests.post(f"{API}/admin/banners", json=payload, headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["kind"] == "slider"
        assert d["title"] == "TEST Slider"
        assert d["active"] is True
        TestBanners.created_ids.append(d["id"])

    def test_admin_create_promo_banner(self, admin_headers):
        payload = {
            "kind": "promo", "title": "TEST Promo", "subtitle": "test promo",
            "image_url": "https://images.unsplash.com/photo-1601543527048-2379e2e6dfe4?w=1200",
            "cta_label": "Buy", "cta_link": "/products", "active": True, "sort_order": 101,
        }
        r = requests.post(f"{API}/admin/banners", json=payload, headers=admin_headers, timeout=20)
        assert r.status_code == 200
        assert r.json()["kind"] == "promo"
        TestBanners.created_ids.append(r.json()["id"])

    def test_public_get_banners_kind_filter(self):
        rs = requests.get(f"{API}/banners", params={"kind": "slider"}, timeout=20)
        assert rs.status_code == 200
        for b in rs.json():
            assert b["kind"] == "slider"
            assert b["active"] is True
        rp = requests.get(f"{API}/banners", params={"kind": "promo"}, timeout=20)
        assert rp.status_code == 200
        for b in rp.json():
            assert b["kind"] == "promo"
            assert b["active"] is True

    def test_public_get_banners_only_active(self, admin_headers):
        # deactivate the slider we created, verify it's excluded
        bid = TestBanners.created_ids[0]
        payload = {
            "kind": "slider", "title": "TEST Slider", "subtitle": "test",
            "image_url": "https://x.com/a.jpg", "cta_label": "Shop", "cta_link": "/products",
            "active": False, "sort_order": 100,
        }
        r = requests.put(f"{API}/admin/banners/{bid}", json=payload, headers=admin_headers, timeout=20)
        assert r.status_code == 200
        assert r.json()["active"] is False
        # confirm excluded from public list
        rs = requests.get(f"{API}/banners", params={"kind": "slider"}, timeout=20)
        assert rs.status_code == 200
        assert bid not in [b["id"] for b in rs.json()]
        # reactivate
        payload["active"] = True
        r2 = requests.put(f"{API}/admin/banners/{bid}", json=payload, headers=admin_headers, timeout=20)
        assert r2.status_code == 200
        assert r2.json()["active"] is True

    def test_admin_banners_non_admin_forbidden(self, customer_headers):
        r = requests.get(f"{API}/admin/banners", headers=customer_headers, timeout=20)
        assert r.status_code == 403
        r2 = requests.post(f"{API}/admin/banners", json={"kind": "slider", "title": "nope"}, headers=customer_headers, timeout=20)
        assert r2.status_code == 403

    def test_zzz_delete_test_banners(self, admin_headers):
        for bid in TestBanners.created_ids:
            r = requests.delete(f"{API}/admin/banners/{bid}", headers=admin_headers, timeout=20)
            assert r.status_code == 200


# --------------- Orders with coupon ---------------
class TestOrderWithCoupon:
    created_coupon = None

    def _get_first_product(self):
        r = requests.get(f"{API}/products", timeout=20)
        assert r.status_code == 200
        arr = r.json()
        assert len(arr) > 0
        return arr[0]

    def test_setup_coupon(self, admin_headers):
        code = f"TESTORDER{uuid.uuid4().hex[:4].upper()}"
        r = requests.post(f"{API}/admin/coupons", json={
            "code": code, "type": "percent", "value": 10, "min_order": 0, "active": True
        }, headers=admin_headers, timeout=20)
        assert r.status_code == 200
        TestOrderWithCoupon.created_coupon = r.json()
        assert r.json()["uses"] == 0

    def test_order_with_valid_coupon(self, customer_headers):
        p = self._get_first_product()
        qty = 2
        expected_subtotal = float(p["price"]) * qty
        expected_discount = round(expected_subtotal * 0.10, 2)
        payload = {
            "items": [{"product_id": p["id"], "quantity": qty}],
            "address": "TEST Farm Rd 1", "phone": "+919000099999",
            "notes": "test order", "coupon_code": TestOrderWithCoupon.created_coupon["code"],
        }
        r = requests.post(f"{API}/orders", json=payload, headers=customer_headers, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["subtotal"] == expected_subtotal
        assert d["discount_amount"] == expected_discount
        assert d["total"] == round(expected_subtotal - expected_discount, 2)
        assert d["status"] == "pending"

    def test_coupon_uses_incremented(self, admin_headers):
        # Give time for write
        time.sleep(0.3)
        r = requests.get(f"{API}/admin/coupons", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        row = next(c for c in r.json() if c["code"] == TestOrderWithCoupon.created_coupon["code"])
        assert row["uses"] >= 1

    def test_order_with_invalid_coupon_rejected(self, customer_headers):
        p = self._get_first_product()
        payload = {
            "items": [{"product_id": p["id"], "quantity": 1}],
            "address": "TEST", "phone": "+919000099999",
            "coupon_code": "NOTREAL_ZZZ_XYZ",
        }
        r = requests.post(f"{API}/orders", json=payload, headers=customer_headers, timeout=20)
        assert r.status_code == 400
        assert "Invalid" in r.json()["detail"]

    def test_order_without_coupon_still_works(self, customer_headers):
        p = self._get_first_product()
        payload = {
            "items": [{"product_id": p["id"], "quantity": 1}],
            "address": "TEST", "phone": "+919000099999",
        }
        r = requests.post(f"{API}/orders", json=payload, headers=customer_headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["discount_amount"] == 0.0
        assert d["total"] == float(p["price"])

    def test_zzz_cleanup_order_coupon(self, admin_headers):
        if TestOrderWithCoupon.created_coupon:
            r = requests.delete(f"{API}/admin/coupons/{TestOrderWithCoupon.created_coupon['id']}", headers=admin_headers, timeout=20)
            assert r.status_code == 200


# --------------- Regression ---------------
class TestRegression:
    def test_products_list(self):
        r = requests.get(f"{API}/products", timeout=20)
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_product_crud(self, admin_headers):
        payload = {"name": "TEST Product", "category": "grains", "price": 10, "unit": "kg", "stock": 5}
        r = requests.post(f"{API}/products", json=payload, headers=admin_headers, timeout=20)
        assert r.status_code == 200
        pid = r.json()["id"]
        # Update
        payload["stock"] = 20
        r2 = requests.put(f"{API}/products/{pid}", json=payload, headers=admin_headers, timeout=20)
        assert r2.status_code == 200
        assert r2.json()["stock"] == 20
        # Delete
        r3 = requests.delete(f"{API}/products/{pid}", headers=admin_headers, timeout=20)
        assert r3.status_code == 200

    def test_admin_order_status_update(self, admin_headers, customer_headers):
        # place a fresh order first
        r0 = requests.get(f"{API}/products", timeout=20)
        p = r0.json()[0]
        order = requests.post(f"{API}/orders", json={
            "items": [{"product_id": p["id"], "quantity": 1}],
            "address": "TEST", "phone": "+919000099998",
        }, headers=customer_headers, timeout=30).json()
        r = requests.put(f"{API}/admin/orders/{order['id']}/status",
                         json={"status": "packed"}, headers=admin_headers, timeout=20)
        assert r.status_code == 200
        assert r.json()["status"] == "packed"

    def test_otp_request_mock(self):
        phone = f"+91900{uuid.uuid4().hex[:7]}"[:15]
        # ensure valid E.164
        phone = "+919000000010"
        r = requests.post(f"{API}/auth/otp/request", json={"phone": phone}, timeout=20)
        # 200 or 429 (rate limit) both fine
        assert r.status_code in (200, 429)

    def test_payment_settings_public(self):
        r = requests.get(f"{API}/payments/settings", timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert "upi_vpa" in d
        assert "payee_name" in d
        assert "razorpay_key_secret" not in d  # secret must not leak
