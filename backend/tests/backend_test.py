"""
Satthamma Farms — Round 3 backend tests (STATIC / anonymous checkout)

Focus:
 - Admin auth (JSON token + HttpOnly cookie), /auth/me
 - Site settings (public GET /api/site, admin PUT /api/admin/site)
 - Anonymous orders (POST /api/orders, no auth) with coupon
 - Removed endpoint /api/orders/mine returns 404
 - Coupons CRUD + validate + role guards
 - Banners CRUD + kind filter + role guards
 - Regression: products CRUD, admin order status update, OTP mock, public payment settings
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = (
    os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
    if os.environ.get("REACT_APP_BACKEND_URL")
    else "https://earthly-eats-3.preview.emergentagent.com"
)
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@satthammafarms.com"
ADMIN_PASS = "Admin@123"


# --------------- helpers / fixtures ---------------
def _login(email, password):
    return requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=20)


@pytest.fixture(scope="session")
def admin_login_response():
    r = _login(ADMIN_EMAIL, ADMIN_PASS)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r


@pytest.fixture(scope="session")
def admin_token(admin_login_response):
    return admin_login_response.json()["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# --------------- Admin auth ---------------
class TestAuth:
    def test_admin_login_returns_cookie_and_role(self, admin_login_response):
        d = admin_login_response.json()
        assert d["user"]["email"] == ADMIN_EMAIL
        assert d["user"]["role"] == "admin"
        assert d["token"]
        assert "access_token" in admin_login_response.cookies

    def test_admin_login_bad_password(self):
        r = _login(ADMIN_EMAIL, "wrong")
        assert r.status_code == 401

    def test_auth_me_with_admin_token(self, admin_headers):
        r = requests.get(f"{API}/auth/me", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == ADMIN_EMAIL
        assert d["role"] == "admin"

    def test_auth_me_no_token_401(self):
        r = requests.get(f"{API}/auth/me", timeout=20)
        assert r.status_code == 401


# --------------- Site settings ---------------
class TestSiteSettings:
    original: dict = {}

    def test_public_get_site_defaults(self):
        r = requests.get(f"{API}/site", timeout=20)
        assert r.status_code == 200
        d = r.json()
        # Must contain all required fields
        for key in [
            "whatsapp_number", "contact_phone", "contact_email", "contact_address",
            "instagram_url", "youtube_url",
            "hero_badge", "hero_title_line1", "hero_title_line2", "hero_tagline",
            "hero_paragraph", "story_title", "story_text", "checkout_whatsapp_note",
        ]:
            assert key in d, f"Missing key: {key}"
        # snapshot original for restore later
        TestSiteSettings.original = dict(d)
        # default WhatsApp number expectation (only assert if not been customized already)
        # If someone previously modified, we won't fail—still ensure it's a non-empty digit string.
        assert d["whatsapp_number"] and d["whatsapp_number"].isdigit()

    def test_admin_put_site_persists(self, admin_headers):
        marker = f"TEST_HERO_{uuid.uuid4().hex[:6]}"
        payload = dict(TestSiteSettings.original) if TestSiteSettings.original else {}
        # Ensure minimum shape:
        if not payload:
            r0 = requests.get(f"{API}/site", timeout=20)
            payload = r0.json()
            TestSiteSettings.original = dict(payload)
        # mutate a field
        payload["hero_badge"] = marker
        payload["whatsapp_number"] = "918500812044"
        r = requests.put(f"{API}/admin/site", json=payload, headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("ok") is True
        assert d["hero_badge"] == marker
        # GET reflects update
        rg = requests.get(f"{API}/site", timeout=20)
        assert rg.status_code == 200
        assert rg.json()["hero_badge"] == marker
        assert rg.json()["whatsapp_number"] == "918500812044"

    def test_admin_put_site_non_admin_401(self):
        # No auth at all → 401
        r = requests.put(f"{API}/admin/site", json={"whatsapp_number": "918500812044"}, timeout=20)
        assert r.status_code == 401

    def test_zzz_restore_site(self, admin_headers):
        if TestSiteSettings.original:
            r = requests.put(f"{API}/admin/site", json=TestSiteSettings.original, headers=admin_headers, timeout=20)
            assert r.status_code == 200


# --------------- Anonymous orders ---------------
class TestAnonymousOrders:
    coupon_id: str = ""
    coupon_code: str = ""

    def _first_product(self):
        r = requests.get(f"{API}/products", timeout=20)
        assert r.status_code == 200
        arr = r.json()
        assert arr
        return arr[0]

    def test_orders_mine_removed_404(self):
        # session-less request; must return 404 not 401.
        r = requests.get(f"{API}/orders/mine", timeout=20)
        assert r.status_code == 404, f"/api/orders/mine should be removed. Got {r.status_code}"

    def test_anonymous_order_no_auth_ok(self):
        p = self._first_product()
        payload = {
            "items": [{"product_id": p["id"], "quantity": 1}],
            "customer_name": "TEST Anon",
            "phone": "+919000099001",
            "pincode": "500001",
            "address": "TEST Anon Addr, Hyderabad",
            "notes": "test note",
        }
        r = requests.post(f"{API}/orders", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "id" in d
        assert d["subtotal"] == float(p["price"])
        assert d["discount_amount"] == 0.0
        assert d["total"] == float(p["price"])
        assert d["status"] == "pending"

    def test_anonymous_order_empty_items_400(self):
        r = requests.post(f"{API}/orders", json={
            "items": [], "customer_name": "TEST", "phone": "+919000099001",
            "pincode": "500001", "address": "x",
        }, timeout=20)
        assert r.status_code == 400

    def test_setup_save10_coupon(self, admin_headers):
        # Look up existing SAVE10; if absent, create it. Do NOT delete at end (needed by frontend home).
        r = requests.get(f"{API}/admin/coupons", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        existing = next((c for c in r.json() if c["code"] == "SAVE10"), None)
        if not existing:
            cr = requests.post(f"{API}/admin/coupons", json={
                "code": "SAVE10", "type": "percent", "value": 10, "min_order": 0, "active": True,
            }, headers=admin_headers, timeout=20)
            assert cr.status_code == 200, cr.text
            existing = cr.json()
        else:
            # Ensure active
            if not existing["active"]:
                requests.put(f"{API}/admin/coupons/{existing['id']}", json={
                    "code": existing["code"], "type": existing["type"], "value": existing["value"],
                    "min_order": existing.get("min_order", 0), "active": True,
                }, headers=admin_headers, timeout=20)
        TestAnonymousOrders.coupon_id = existing["id"]
        TestAnonymousOrders.coupon_code = existing["code"]

    def test_anonymous_order_with_save10_applies_and_increments_uses(self, admin_headers):
        assert TestAnonymousOrders.coupon_code, "SAVE10 not set up"
        # Snapshot uses before
        rlist = requests.get(f"{API}/admin/coupons", headers=admin_headers, timeout=20).json()
        before = next(c for c in rlist if c["code"] == "SAVE10")["uses"]
        p = self._first_product()
        qty = 2
        subtotal = float(p["price"]) * qty
        expected_discount = round(subtotal * 0.10, 2)
        payload = {
            "items": [{"product_id": p["id"], "quantity": qty}],
            "customer_name": "TEST Anon2",
            "phone": "+919000099002",
            "pincode": "500002",
            "address": "TEST Addr 2",
            "notes": "",
            "coupon_code": "SAVE10",
        }
        r = requests.post(f"{API}/orders", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["subtotal"] == subtotal
        assert d["discount_amount"] == expected_discount
        assert d["total"] == round(subtotal - expected_discount, 2)
        # uses increment
        time.sleep(0.3)
        rlist2 = requests.get(f"{API}/admin/coupons", headers=admin_headers, timeout=20).json()
        after = next(c for c in rlist2 if c["code"] == "SAVE10")["uses"]
        assert after == before + 1

    def test_anonymous_order_invalid_coupon_400(self):
        p = self._first_product()
        r = requests.post(f"{API}/orders", json={
            "items": [{"product_id": p["id"], "quantity": 1}],
            "customer_name": "TEST", "phone": "+919000099003",
            "pincode": "500003", "address": "TEST",
            "coupon_code": "NOSUCH_ZZZ_XYZ",
        }, timeout=20)
        assert r.status_code == 400
        assert "Invalid" in r.json()["detail"] or "invalid" in r.json()["detail"].lower()

    def test_admin_orders_lists_anonymous(self, admin_headers):
        r = requests.get(f"{API}/admin/orders", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list) and arr, "No orders returned"
        # Find one of our anonymous test orders (customer_name starts with TEST Anon)
        anon = next((o for o in arr if o.get("customer_name", "").startswith("TEST Anon")), None)
        assert anon is not None, "Anonymous test order not present"
        for key in ("customer_name", "phone", "pincode", "address", "items", "id", "total", "status"):
            assert key in anon, f"Missing key {key} in admin orders response"


# --------------- Coupons CRUD & Validation (regression) ---------------
class TestCoupons:
    created_ids = []

    def test_admin_create_percent_coupon(self, admin_headers):
        code = f"TESTSAVE{uuid.uuid4().hex[:4].upper()}"
        payload = {"code": code, "type": "percent", "value": 10, "min_order": 100, "max_uses": 5, "active": True}
        r = requests.post(f"{API}/admin/coupons", json=payload, headers=admin_headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["code"] == code and d["type"] == "percent" and d["value"] == 10
        TestCoupons.created_ids.append((d["id"], code))

    def test_admin_coupons_no_auth_unauthorized(self):
        r = requests.get(f"{API}/admin/coupons", timeout=20)
        assert r.status_code == 401

    def test_validate_percent_coupon(self):
        _cid, code = TestCoupons.created_ids[0]
        r = requests.post(f"{API}/coupons/validate", json={"code": code, "cart_total": 500}, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["discount_amount"] == 50.0 and d["new_total"] == 450.0

    def test_validate_min_order_not_met(self):
        _cid, code = TestCoupons.created_ids[0]
        r = requests.post(f"{API}/coupons/validate", json={"code": code, "cart_total": 50}, timeout=20)
        assert r.status_code == 400

    def test_validate_unknown_code(self):
        r = requests.post(f"{API}/coupons/validate", json={"code": "NOSUCHCODEZZZ", "cart_total": 500}, timeout=20)
        assert r.status_code == 400

    def test_zzz_delete_all_test_coupons(self, admin_headers):
        for cid, _code in TestCoupons.created_ids:
            r = requests.delete(f"{API}/admin/coupons/{cid}", headers=admin_headers, timeout=20)
            assert r.status_code == 200


# --------------- Banners CRUD (regression) ---------------
class TestBanners:
    created_ids = []

    def test_admin_create_slider_banner(self, admin_headers):
        payload = {
            "kind": "slider", "title": "TEST Slider", "subtitle": "test",
            "image_url": "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1200",
            "cta_label": "Shop", "cta_link": "/products", "active": True, "sort_order": 100,
        }
        r = requests.post(f"{API}/admin/banners", json=payload, headers=admin_headers, timeout=20)
        assert r.status_code == 200
        TestBanners.created_ids.append(r.json()["id"])

    def test_public_get_banners_kind_filter(self):
        rs = requests.get(f"{API}/banners", params={"kind": "slider"}, timeout=20)
        assert rs.status_code == 200
        for b in rs.json():
            assert b["kind"] == "slider" and b["active"] is True

    def test_admin_banners_no_auth_unauthorized(self):
        r = requests.get(f"{API}/admin/banners", timeout=20)
        assert r.status_code == 401

    def test_zzz_delete_test_banners(self, admin_headers):
        for bid in TestBanners.created_ids:
            r = requests.delete(f"{API}/admin/banners/{bid}", headers=admin_headers, timeout=20)
            assert r.status_code == 200


# --------------- Regression ---------------
class TestRegression:
    def test_products_list(self):
        r = requests.get(f"{API}/products", timeout=20)
        assert r.status_code == 200 and len(r.json()) >= 1

    def test_product_crud(self, admin_headers):
        payload = {"name": "TEST Product", "category": "grains", "price": 10, "unit": "kg", "stock": 5}
        r = requests.post(f"{API}/products", json=payload, headers=admin_headers, timeout=20)
        assert r.status_code == 200
        pid = r.json()["id"]
        payload["stock"] = 20
        r2 = requests.put(f"{API}/products/{pid}", json=payload, headers=admin_headers, timeout=20)
        assert r2.status_code == 200 and r2.json()["stock"] == 20
        r3 = requests.delete(f"{API}/products/{pid}", headers=admin_headers, timeout=20)
        assert r3.status_code == 200

    def test_admin_order_status_confirmed(self, admin_headers):
        # place anonymous order, then move to 'confirmed' (new allowed status)
        p = requests.get(f"{API}/products", timeout=20).json()[0]
        order = requests.post(f"{API}/orders", json={
            "items": [{"product_id": p["id"], "quantity": 1}],
            "customer_name": "TEST", "phone": "+919000099010",
            "pincode": "500004", "address": "TEST",
        }, timeout=30).json()
        r = requests.put(f"{API}/admin/orders/{order['id']}/status",
                         json={"status": "confirmed"}, headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "confirmed"

    def test_payment_settings_public(self):
        r = requests.get(f"{API}/payments/settings", timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert "upi_vpa" in d
        assert "razorpay_key_secret" not in d
