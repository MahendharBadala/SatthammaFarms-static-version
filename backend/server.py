from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from pydantic import BaseModel, Field, EmailStr, BeforeValidator
from typing import List, Optional, Annotated, Any
from datetime import datetime, timezone, timedelta
import os
import logging
import bcrypt
import jwt as pyjwt
import uuid
import requests

# ---------------- Mongo ----------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ---------------- Auth helpers ----------------
JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return pyjwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def _oid(v: Any) -> str:
    if isinstance(v, ObjectId):
        return str(v)
    return str(v)

PyObjectId = Annotated[str, BeforeValidator(_oid)]

# ---------------- Models ----------------
class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str
    created_at: Optional[str] = None

class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class ProductIn(BaseModel):
    name: str
    category: str
    price: float
    unit: str = "kg"
    description: str = ""
    image_url: str = ""
    video_url: Optional[str] = None
    gallery: List[str] = []
    stock: int = 100
    featured: bool = False

class ProductOut(ProductIn):
    id: str
    created_at: str

class CartItemIn(BaseModel):
    product_id: str
    quantity: int = 1

class OrderIn(BaseModel):
    items: List[CartItemIn]
    address: str
    phone: str
    customer_name: str = ""
    pincode: str = ""
    notes: Optional[str] = ""
    coupon_code: Optional[str] = ""

class PaymentSettingsIn(BaseModel):
    provider: str = "upi_manual"      # upi_manual | razorpay | disabled
    upi_vpa: str = "7981282044@ybl"
    payee_name: str = "SATTHAMMA FARMS"
    razorpay_key_id: Optional[str] = ""
    razorpay_key_secret: Optional[str] = ""
    instructions: str = "Pay via any UPI app, then click 'I have paid' and share the UTR reference."

class OrderConfirmIn(BaseModel):
    utr: str = ""
    method: str = "upi"

class OrderStatusIn(BaseModel):
    status: str  # pending | payment_pending_verification | paid | packed | shipped | delivered | cancelled

# ---------------- Coupons ----------------
class CouponIn(BaseModel):
    code: str
    type: str = "percent"  # percent | flat
    value: float = 0
    min_order: float = 0
    max_uses: Optional[int] = None  # None or 0 = unlimited
    expires_at: Optional[str] = None  # ISO date string; None = no expiry
    active: bool = True

class CouponValidateIn(BaseModel):
    code: str
    cart_total: float = 0

# ---------------- Banners ----------------
class BannerIn(BaseModel):
    kind: str = "slider"  # slider | promo
    title: str = ""
    subtitle: str = ""
    image_url: str = ""
    cta_label: str = ""
    cta_link: str = ""
    active: bool = True
    sort_order: int = 0

# ---------------- Site settings ----------------
class SiteSettingsIn(BaseModel):
    # Contact / brand
    whatsapp_number: str = "918500812044"  # E.164 without + (wa.me format)
    contact_phone: str = "+91 85008 12044"
    contact_email: str = "satthammafarms@gmail.com"
    contact_address: str = "505453, Medipally, Medipally Mandal, Jagityal Dist, Telangana"
    instagram_url: str = "https://www.instagram.com/satthammamucchatlu"
    youtube_url: str = "https://youtube.com/@sathammamucchatlu"
    # Hero
    hero_badge: str = "Organic · Chemical-free · Since generations"
    hero_title_line1: str = "From our soil,"
    hero_title_line2: str = "to your table."
    hero_tagline: str = "prathiokkari intaa, nanyamaina panta"
    hero_paragraph: str = ("Satthamma Farms grows grains, pulses, spices and pickles the way our grandparents did — "
                          "with sunlight, patience and zero harmful chemicals. Every pack you receive is a small piece "
                          "of Medipally in your kitchen.")
    # Story strip
    story_title: str = "Farming the way it was meant to be."
    story_text: str = ("At Satthamma Farms, we practice mostly organic farming — no harmful chemicals, no artificial "
                       "fertilizers, no shortcuts to force the earth. We believe patient soil grows honest food. "
                       "Follow our day-to-day life on Instagram and YouTube — every harvest, every rain, every meal.")
    # Checkout notice
    checkout_whatsapp_note: str = ("On clicking Order, you'll be redirected to WhatsApp to confirm your order "
                                   "with our team. Your cart + delivery details are prefilled for you.")

# ---------------- App ----------------
app = FastAPI(title="Satthamma Farms API")
api = APIRouter(prefix="/api")

_frontend_origin = os.environ.get("FRONTEND_URL", "")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=".*" if not _frontend_origin else None,
    allow_origins=[_frontend_origin] if _frontend_origin else [],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Auth deps ----------------
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = pyjwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    try:
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user id")
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    user["id"] = str(user["_id"])
    user.pop("_id", None)
    user.pop("password_hash", None)
    return user

async def get_admin_user(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def user_to_public(u: dict) -> dict:
    return {
        "id": str(u.get("_id") or u.get("id")),
        "email": u["email"],
        "name": u.get("name", ""),
        "role": u.get("role", "customer"),
        "created_at": u.get("created_at", ""),
        "phone": u.get("phone", ""),
    }

def set_auth_cookie(response: Response, token: str):
    # httpOnly cookie protects token from XSS; SameSite=Lax works for same-origin ingress routing.
    response.set_cookie(
        key="access_token", value=token, httponly=True,
        secure=True, samesite="lax", max_age=7*24*3600, path="/",
    )

# ---------------- Routes ----------------
@api.get("/")
async def root():
    return {"message": "Satthamma Farms API", "status": "ok"}

# --- Auth ---
@api.post("/auth/register")
async def register(payload: RegisterInput, response: Response):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "email": email,
        "name": payload.name.strip(),
        "phone": payload.phone or "",
        "password_hash": hash_password(payload.password),
        "role": "customer",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.users.insert_one(doc)
    doc["_id"] = res.inserted_id
    token = create_access_token(str(res.inserted_id), email, "customer")
    set_auth_cookie(response, token)
    # Welcome email (mock or real depending on SENDGRID_API_KEY)
    _send_email(email, "Welcome to Satthamma Farms 🌾",
                f"<div style='font-family:Manrope,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#F9F6F0;border-radius:12px'>"
                f"<div style='font-size:12px;letter-spacing:.2em;color:#C5684B'>SATTHAMMA FARMS</div>"
                f"<h1 style='font-family:Georgia,serif;color:#2C4C3B'>Welcome, {doc['name']}!</h1>"
                f"<p>Thank you for joining our family. Every grain we grow is chemical-free, hand-harvested, and packed with pride from Medipally, Telangana.</p>"
                f"<p style='font-family:Georgia,serif;font-style:italic;color:#C5684B'>\"prathiokkari intaa, nanyamaina panta\"</p></div>",
                plain=f"Welcome to Satthamma Farms, {doc['name']}!")
    return {"user": user_to_public(doc), "token": token}

@api.post("/auth/login")
async def login(payload: LoginInput, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user["_id"]), email, user.get("role", "customer"))
    set_auth_cookie(response, token)
    return {"user": user_to_public(user), "token": token}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

# --- Phone OTP (mock mode: OTP printed to server console) ---
import random
import re

class OtpRequestIn(BaseModel):
    phone: str  # E.164 like "+918500812044"

class OtpVerifyIn(BaseModel):
    phone: str
    code: str
    name: Optional[str] = None

_PHONE_RE = re.compile(r"^\+[1-9]\d{6,14}$")

def _normalize_phone(raw: str) -> str:
    p = (raw or "").strip().replace(" ", "").replace("-", "")
    if not _PHONE_RE.match(p):
        raise HTTPException(status_code=400, detail="Invalid phone. Use E.164 like +919999999999")
    return p

@api.post("/auth/otp/request")
async def otp_request(payload: OtpRequestIn):
    phone = _normalize_phone(payload.phone)
    # rate-limit: 30s between requests
    last = await db.otp_codes.find_one({"phone": phone}, sort=[("created_at", -1)])
    now = datetime.now(timezone.utc)
    if last:
        last_at = datetime.fromisoformat(last["created_at"])
        if (now - last_at).total_seconds() < 30:
            raise HTTPException(status_code=429, detail="Please wait a few seconds before requesting another OTP")
    code = f"{random.randint(0, 999999):06d}"
    await db.otp_codes.insert_one({
        "phone": phone,
        "code": code,
        "attempts": 0,
        "used": False,
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(minutes=10)).isoformat(),
    })
    # MOCK: log to server console. Replace with Twilio/MSG91 later.
    logger.info(f"[SATTHAMMA OTP][MOCK] phone={phone} code={code} (valid 10 min)")
    print(f"\n===== SATTHAMMA OTP =====\nphone: {phone}\ncode : {code}\n=========================\n", flush=True)
    return {"ok": True, "message": "OTP sent (mock mode — check server console)"}

@api.post("/auth/otp/verify")
async def otp_verify(payload: OtpVerifyIn, response: Response):
    phone = _normalize_phone(payload.phone)
    code = (payload.code or "").strip()
    rec = await db.otp_codes.find_one({"phone": phone, "used": False}, sort=[("created_at", -1)])
    if not rec:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")
    if datetime.fromisoformat(rec["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
    if rec.get("attempts", 0) >= 5:
        raise HTTPException(status_code=429, detail="Too many wrong attempts. Request a new OTP.")
    if rec["code"] != code:
        await db.otp_codes.update_one({"_id": rec["_id"]}, {"$inc": {"attempts": 1}})
        raise HTTPException(status_code=400, detail="Incorrect OTP")
    await db.otp_codes.update_one({"_id": rec["_id"]}, {"$set": {"used": True}})

    user = await db.users.find_one({"phone": phone})
    if not user:
        # No auto-register: require name on first-time signup
        if not payload.name or not payload.name.strip():
            return {"needs_name": True}
        doc = {
            "email": "",
            "name": payload.name.strip(),
            "phone": phone,
            "password_hash": "",
            "role": "customer",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        res = await db.users.insert_one(doc)
        doc["_id"] = res.inserted_id
        user = doc

    token = create_access_token(str(user["_id"]), user.get("email", "") or phone, user.get("role", "customer"))
    set_auth_cookie(response, token)
    return {"user": user_to_public(user), "needs_name": False}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user_to_public({**user, "_id": user["id"]})

# --- Products ---
def product_to_out(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "category": doc.get("category", ""),
        "price": float(doc.get("price", 0)),
        "unit": doc.get("unit", "kg"),
        "description": doc.get("description", ""),
        "image_url": doc.get("image_url", ""),
        "video_url": doc.get("video_url", ""),
        "gallery": list(doc.get("gallery", []) or []),
        "stock": int(doc.get("stock", 0)),
        "featured": bool(doc.get("featured", False)),
        "created_at": doc.get("created_at", ""),
    }

@api.get("/products")
async def list_products(category: Optional[str] = None, q: Optional[str] = None):
    query: dict = {}
    if category and category != "all":
        query["category"] = category
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    docs = await db.products.find(query).sort("created_at", -1).to_list(500)
    return [product_to_out(d) for d in docs]

@api.get("/products/{pid}")
async def get_product(pid: str):
    try:
        doc = await db.products.find_one({"_id": ObjectId(pid)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_to_out(doc)

@api.post("/products")
async def create_product(payload: ProductIn, _admin: dict = Depends(get_admin_user)):
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.products.insert_one(doc)
    doc["_id"] = res.inserted_id
    return product_to_out(doc)

@api.put("/products/{pid}")
async def update_product(pid: str, payload: ProductIn, _admin: dict = Depends(get_admin_user)):
    try:
        oid = ObjectId(pid)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid id") from exc
    await db.products.update_one({"_id": oid}, {"$set": payload.model_dump()})
    doc: Optional[dict] = await db.products.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return product_to_out(doc)

@api.delete("/products/{pid}")
async def delete_product(pid: str, _admin: dict = Depends(get_admin_user)):
    try:
        await db.products.delete_one({"_id": ObjectId(pid)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    return {"ok": True}

# --- Categories ---
@api.get("/categories")
async def list_categories():
    return [
        {"key": "grains", "label": "Grains"},
        {"key": "pulses", "label": "Pulses"},
        {"key": "pickles", "label": "Pickles"},
        {"key": "spices", "label": "Masalas & Spices"},
        {"key": "seeds", "label": "Seeds"},
        {"key": "cotton", "label": "Cotton"},
        {"key": "other", "label": "Other"},
    ]

# --- Orders ---
@api.post("/orders")
async def create_order(payload: OrderIn, request: Request):
    # Anonymous checkout — no auth required. Order stores customer contact fields.
    total = 0.0
    items_full = []
    # Bulk-fetch all products in one query to avoid N+1
    try:
        oids = [ObjectId(it.product_id) for it in payload.items]
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid product id") from exc
    if not oids:
        raise HTTPException(status_code=400, detail="Cart is empty")
    products = await db.products.find({"_id": {"$in": oids}}).to_list(len(oids))
    p_map = {str(p["_id"]): p for p in products}
    for it in payload.items:
        p = p_map.get(it.product_id)
        if not p:
            continue
        line = float(p["price"]) * int(it.quantity)
        total += line
        items_full.append({
            "product_id": str(p["_id"]),
            "name": p["name"],
            "price": float(p["price"]),
            "quantity": int(it.quantity),
            "line_total": line,
        })
    if not items_full:
        raise HTTPException(status_code=400, detail="No valid products in cart")
    # Apply coupon if provided
    subtotal = total
    discount_amount = 0.0
    coupon_applied = None
    code = (payload.coupon_code or "").strip().upper()
    if code:
        coupon = await db.coupons.find_one({"code": code})
        ok, discount_amount, reason = _evaluate_coupon(coupon, subtotal)
        if not ok:
            raise HTTPException(status_code=400, detail=reason)
        total = max(0.0, subtotal - discount_amount)
        coupon_applied = {
            "code": coupon["code"], "type": coupon["type"], "value": coupon["value"],
            "discount_amount": discount_amount,
        }
    doc = {
        "customer_name": payload.customer_name.strip(),
        "phone": payload.phone,
        "pincode": (payload.pincode or "").strip(),
        "address": payload.address,
        "items": items_full,
        "subtotal": subtotal,
        "discount_amount": discount_amount,
        "coupon": coupon_applied,
        "total": total,
        "notes": payload.notes or "",
        "status": "pending",
        "channel": "whatsapp",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.orders.insert_one(doc)
    doc["_id"] = res.inserted_id
    # Increment coupon usage
    if coupon_applied:
        await db.coupons.update_one({"code": code}, {"$inc": {"uses": 1}})
    return {
        "id": str(res.inserted_id),
        "total": total,
        "subtotal": subtotal,
        "discount_amount": discount_amount,
        "status": "pending",
    }

@api.get("/admin/orders")
async def all_orders(_admin: dict = Depends(get_admin_user)):
    docs = await db.orders.find({}).sort("created_at", -1).to_list(1000)
    return [{**{k: v for k, v in d.items() if k != "_id"}, "id": str(d["_id"])} for d in docs]

@api.get("/admin/users")
async def all_users(_admin: dict = Depends(get_admin_user)):
    docs = await db.users.find({}).sort("created_at", -1).to_list(1000)
    return [user_to_public(d) for d in docs]

# --- Payment settings (public read, admin write) ---
DEFAULT_PAYMENT_SETTINGS = {
    "provider": "upi_manual",
    "upi_vpa": "7981282044@ybl",
    "payee_name": "SATTHAMMA FARMS",
    "razorpay_key_id": "",
    "razorpay_key_secret": "",
    "instructions": "Pay via any UPI app, then click 'I have paid' and share the UTR reference.",
}

async def _get_settings() -> dict:
    doc = await db.settings.find_one({"_id": "payment"})
    if not doc:
        await db.settings.insert_one({"_id": "payment", **DEFAULT_PAYMENT_SETTINGS})
        return dict(DEFAULT_PAYMENT_SETTINGS)
    return {k: doc.get(k, v) for k, v in DEFAULT_PAYMENT_SETTINGS.items()}

@api.get("/payments/settings")
async def get_public_payment_settings():
    s = await _get_settings()
    # Never expose secret to non-admin callers
    return {"provider": s["provider"], "upi_vpa": s["upi_vpa"], "payee_name": s["payee_name"], "instructions": s["instructions"], "razorpay_key_id": s.get("razorpay_key_id", "")}

@api.get("/admin/payments/settings")
async def get_full_payment_settings(_admin: dict = Depends(get_admin_user)):
    return await _get_settings()

@api.put("/admin/payments/settings")
async def update_payment_settings(payload: PaymentSettingsIn, _admin: dict = Depends(get_admin_user)):
    data = payload.model_dump()
    await db.settings.update_one({"_id": "payment"}, {"$set": data}, upsert=True)
    return {"ok": True, **data}

# --- Order confirmation + status flow ---
@api.post("/orders/{oid}/confirm-payment")
async def confirm_payment(oid: str, payload: OrderConfirmIn, user: dict = Depends(get_current_user)):
    try:
        order = await db.orders.find_one({"_id": ObjectId(oid)})
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid order id") from exc
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not your order")
    now = datetime.now(timezone.utc).isoformat()
    await db.orders.update_one({"_id": order["_id"]}, {"$set": {
        "status": "payment_pending_verification",
        "payment_method": payload.method or "upi",
        "payment_utr": (payload.utr or "").strip(),
        "payment_claimed_at": now,
    }})
    return {"ok": True, "status": "payment_pending_verification"}

_ALLOWED_STATUSES = {"pending", "confirmed", "payment_pending_verification", "paid", "packed", "shipped", "delivered", "cancelled"}

_STATUS_COPY = {
    "paid": ("Payment confirmed · Satthamma Farms", "We've verified your payment. Your harvest is being prepared."),
    "packed": ("Your order is packed 🌾", "Your order has been packed with care and is ready for dispatch."),
    "shipped": ("On its way! 🚚", "Your order has left the farm and is on its way to you."),
    "delivered": ("Delivered — thank you!", "Your order has been delivered. We hope every grain brings joy to your kitchen."),
    "cancelled": ("Order cancelled", "Your order has been cancelled. If this was unexpected, please reply to this email."),
}

@api.put("/admin/orders/{oid}/status")
async def admin_update_order_status(oid: str, payload: OrderStatusIn, _admin: dict = Depends(get_admin_user)):
    if payload.status not in _ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {sorted(_ALLOWED_STATUSES)}")
    try:
        oidv = ObjectId(oid)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid order id") from exc
    now = datetime.now(timezone.utc).isoformat()
    upd = {"status": payload.status, f"status_{payload.status}_at": now}
    await db.orders.update_one({"_id": oidv}, {"$set": upd})
    # Notify buyer by email when the status has customer-facing copy
    if payload.status in _STATUS_COPY:
        order = await db.orders.find_one({"_id": oidv})
        buyer_email = (order or {}).get("user_email", "")
        if buyer_email:
            subj, msg = _STATUS_COPY[payload.status]
            html = (f"<div style='font-family:Manrope,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#F9F6F0;border-radius:12px'>"
                    f"<div style='font-size:12px;letter-spacing:.2em;color:#C5684B'>SATTHAMMA FARMS</div>"
                    f"<h1 style='font-family:Georgia,serif;color:#2C4C3B'>{subj}</h1>"
                    f"<p>Order <b>{str(oidv)[-8:].upper()}</b> · Total <b style='color:#2C4C3B'>₹{order.get('total',0)}</b></p>"
                    f"<p>{msg}</p>"
                    f"<p style='font-family:Georgia,serif;font-style:italic;color:#C5684B'>\"prathiokkari intaa, nanyamaina panta\"</p></div>")
            _send_email(buyer_email, subj, html, plain=msg)
    return {"ok": True, "status": payload.status}

# --- Coupons ---
def _coupon_to_out(c: dict) -> dict:
    return {
        "id": str(c["_id"]),
        "code": c.get("code", ""),
        "type": c.get("type", "percent"),
        "value": float(c.get("value", 0)),
        "min_order": float(c.get("min_order", 0)),
        "max_uses": c.get("max_uses"),
        "expires_at": c.get("expires_at"),
        "active": bool(c.get("active", True)),
        "uses": int(c.get("uses", 0)),
        "created_at": c.get("created_at", ""),
    }

def _evaluate_coupon(coupon: Optional[dict], cart_total: float) -> tuple[bool, float, str]:
    if not coupon:
        return False, 0.0, "Invalid coupon code"
    if not coupon.get("active", True):
        return False, 0.0, "Coupon is not active"
    exp = coupon.get("expires_at")
    if exp:
        try:
            if datetime.fromisoformat(exp) < datetime.now(timezone.utc):
                return False, 0.0, "Coupon has expired"
        except Exception:
            pass
    max_uses = coupon.get("max_uses")
    if max_uses and int(coupon.get("uses", 0)) >= int(max_uses):
        return False, 0.0, "Coupon usage limit reached"
    min_order = float(coupon.get("min_order", 0) or 0)
    if cart_total < min_order:
        return False, 0.0, f"Minimum order ₹{min_order:g} required for this coupon"
    ctype = coupon.get("type", "percent")
    val = float(coupon.get("value", 0) or 0)
    if ctype == "percent":
        discount = round(cart_total * val / 100.0, 2)
    else:
        discount = min(val, cart_total)
    return True, float(discount), "ok"

@api.post("/coupons/validate")
async def validate_coupon(payload: CouponValidateIn):
    code = (payload.code or "").strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Enter a coupon code")
    coupon = await db.coupons.find_one({"code": code})
    ok, discount, reason = _evaluate_coupon(coupon, float(payload.cart_total or 0))
    if not ok:
        raise HTTPException(status_code=400, detail=reason)
    return {
        "code": coupon["code"],
        "type": coupon["type"],
        "value": float(coupon["value"]),
        "discount_amount": discount,
        "new_total": max(0.0, float(payload.cart_total) - discount),
    }

@api.get("/admin/coupons")
async def admin_list_coupons(_admin: dict = Depends(get_admin_user)):
    docs = await db.coupons.find({}).sort("created_at", -1).to_list(500)
    return [_coupon_to_out(d) for d in docs]

@api.post("/admin/coupons")
async def admin_create_coupon(payload: CouponIn, _admin: dict = Depends(get_admin_user)):
    code = payload.code.strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Code is required")
    if await db.coupons.find_one({"code": code}):
        raise HTTPException(status_code=400, detail="A coupon with this code already exists")
    doc = payload.model_dump()
    doc["code"] = code
    doc["uses"] = 0
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.coupons.insert_one(doc)
    doc["_id"] = res.inserted_id
    return _coupon_to_out(doc)

@api.put("/admin/coupons/{cid}")
async def admin_update_coupon(cid: str, payload: CouponIn, _admin: dict = Depends(get_admin_user)):
    try:
        oid = ObjectId(cid)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid id") from exc
    data = payload.model_dump()
    data["code"] = data["code"].strip().upper()
    await db.coupons.update_one({"_id": oid}, {"$set": data})
    doc = await db.coupons.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return _coupon_to_out(doc)

@api.delete("/admin/coupons/{cid}")
async def admin_delete_coupon(cid: str, _admin: dict = Depends(get_admin_user)):
    try:
        await db.coupons.delete_one({"_id": ObjectId(cid)})
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid id") from exc
    return {"ok": True}

# --- Banners ---
def _banner_to_out(b: dict) -> dict:
    return {
        "id": str(b["_id"]),
        "kind": b.get("kind", "slider"),
        "title": b.get("title", ""),
        "subtitle": b.get("subtitle", ""),
        "image_url": b.get("image_url", ""),
        "cta_label": b.get("cta_label", ""),
        "cta_link": b.get("cta_link", ""),
        "active": bool(b.get("active", True)),
        "sort_order": int(b.get("sort_order", 0)),
        "created_at": b.get("created_at", ""),
    }

@api.get("/banners")
async def public_list_banners(kind: Optional[str] = None):
    q: dict = {"active": True}
    if kind:
        q["kind"] = kind
    docs = await db.banners.find(q).sort([("sort_order", 1), ("created_at", -1)]).to_list(100)
    return [_banner_to_out(d) for d in docs]

@api.get("/admin/banners")
async def admin_list_banners(_admin: dict = Depends(get_admin_user)):
    docs = await db.banners.find({}).sort([("sort_order", 1), ("created_at", -1)]).to_list(500)
    return [_banner_to_out(d) for d in docs]

@api.post("/admin/banners")
async def admin_create_banner(payload: BannerIn, _admin: dict = Depends(get_admin_user)):
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.banners.insert_one(doc)
    doc["_id"] = res.inserted_id
    return _banner_to_out(doc)

@api.put("/admin/banners/{bid}")
async def admin_update_banner(bid: str, payload: BannerIn, _admin: dict = Depends(get_admin_user)):
    try:
        oid = ObjectId(bid)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid id") from exc
    await db.banners.update_one({"_id": oid}, {"$set": payload.model_dump()})
    doc = await db.banners.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Banner not found")
    return _banner_to_out(doc)

@api.delete("/admin/banners/{bid}")
async def admin_delete_banner(bid: str, _admin: dict = Depends(get_admin_user)):
    try:
        await db.banners.delete_one({"_id": ObjectId(bid)})
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid id") from exc
    return {"ok": True}

# --- Site settings ---
DEFAULT_SITE_SETTINGS = SiteSettingsIn().model_dump()

async def _get_site_settings() -> dict:
    doc = await db.site.find_one({"_id": "site"})
    if not doc:
        await db.site.insert_one({"_id": "site", **DEFAULT_SITE_SETTINGS})
        return dict(DEFAULT_SITE_SETTINGS)
    return {k: doc.get(k, v) for k, v in DEFAULT_SITE_SETTINGS.items()}

@api.get("/site")
async def public_site_settings():
    return await _get_site_settings()

@api.put("/admin/site")
async def admin_update_site_settings(payload: SiteSettingsIn, _admin: dict = Depends(get_admin_user)):
    data = payload.model_dump()
    await db.site.update_one({"_id": "site"}, {"$set": data}, upsert=True)
    return {"ok": True, **data}

# --- Email (SendGrid — auto mock mode until SENDGRID_API_KEY is set) ---
def _send_email(to_email: str, subject: str, html: str, plain: Optional[str] = None) -> dict:
    api_key = os.environ.get("SENDGRID_API_KEY", "").strip()
    from_email = os.environ.get("SENDGRID_FROM_EMAIL", "satthammafarms@gmail.com")
    from_name = os.environ.get("SENDGRID_FROM_NAME", "Satthamma Farms")
    if not to_email:
        return {"sent": False, "reason": "no_recipient"}
    if not api_key:
        # Mock mode — print full email to console
        print(f"\n===== SATTHAMMA EMAIL (MOCK) =====\nTo: {to_email}\nFrom: {from_name} <{from_email}>\nSubject: {subject}\n---\n{plain or html[:400]}\n=================================\n", flush=True)
        logger.info(f"[EMAIL MOCK] to={to_email} subject={subject!r}")
        return {"sent": True, "mock": True}
    payload = {
        "personalizations": [{"to": [{"email": to_email}]}],
        "from": {"email": from_email, "name": from_name},
        "subject": subject,
        "content": [
            {"type": "text/plain", "value": plain or html},
            {"type": "text/html", "value": html},
        ],
    }
    try:
        r = requests.post("https://api.sendgrid.com/v3/mail/send",
                          json=payload,
                          headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                          timeout=15)
        if r.status_code >= 400:
            logger.error(f"[EMAIL FAIL] {r.status_code}: {r.text[:200]}")
            return {"sent": False, "status": r.status_code}
        return {"sent": True}
    except Exception as e:
        logger.error(f"[EMAIL EXC] {e}")
        return {"sent": False, "error": str(e)}

def _order_html(order: dict, kind: str = "buyer") -> str:
    lines = "".join(
        f"<tr><td style='padding:6px 12px;border-bottom:1px solid #eee'>{i['name']} × {i['quantity']}</td>"
        f"<td style='padding:6px 12px;border-bottom:1px solid #eee;text-align:right'>₹{i['line_total']}</td></tr>"
        for i in order.get("items", [])
    )
    who = "New order received!" if kind == "admin" else "Thank you for your order!"
    return f"""<div style='font-family:Manrope,sans-serif;max-width:560px;margin:0 auto;color:#2C2C2C'>
<div style='background:#2C4C3B;color:#F9F6F0;padding:24px;border-radius:12px 12px 0 0'>
<div style='font-size:12px;letter-spacing:.2em;color:#D4A373'>SATTHAMMA FARMS</div>
<h1 style='font-family:Georgia,serif;margin:8px 0 0'>{who}</h1></div>
<div style='background:#F9F6F0;padding:24px;border:1px solid #E5E0D8;border-top:0;border-radius:0 0 12px 12px'>
<p>Order <b>{order['id'][-8:].upper()}</b> · Total <b style='color:#2C4C3B'>₹{order['total']}</b></p>
<table style='width:100%;border-collapse:collapse;margin-top:12px'>{lines}</table>
<p style='margin-top:16px;font-size:13px;color:#6B6A66'>Deliver to: {order.get('address','')}<br/>Phone: {order.get('phone','')}</p>
<p style='margin-top:16px;font-size:13px;color:#6B6A66'>Track status any time in <a href='#'>My Orders</a>.</p>
<p style='margin-top:24px;font-family:Georgia,serif;font-style:italic;color:#C5684B'>"prathiokkari intaa, nanyamaina panta"</p>
</div></div>"""
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "satthamma-farms"
_storage_key: Optional[str] = None

def _init_storage() -> Optional[str]:
    global _storage_key
    if _storage_key:
        return _storage_key
    if not EMERGENT_KEY:
        return None
    try:
        r = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        r.raise_for_status()
        _storage_key = r.json()["storage_key"]
        return _storage_key
    except Exception as exc:
        logging.getLogger(__name__).error(f"Storage init failed: {exc}")
        return None

def _put_object(path: str, data: bytes, content_type: str) -> dict:
    key = _init_storage()
    if not key:
        raise HTTPException(status_code=503, detail="Storage not configured")
    r = requests.put(f"{STORAGE_URL}/objects/{path}",
                     headers={"X-Storage-Key": key, "Content-Type": content_type},
                     data=data, timeout=120)
    if r.status_code == 403:
        # key expired: refresh once
        globals()["_storage_key"] = None
        key = _init_storage()
        r = requests.put(f"{STORAGE_URL}/objects/{path}",
                         headers={"X-Storage-Key": key, "Content-Type": content_type},
                         data=data, timeout=120)
    r.raise_for_status()
    return r.json()

def _get_object(path: str) -> tuple[bytes, str]:
    key = _init_storage()
    if not key:
        raise HTTPException(status_code=503, detail="Storage not configured")
    r = requests.get(f"{STORAGE_URL}/objects/{path}",
                     headers={"X-Storage-Key": key}, timeout=60)
    r.raise_for_status()
    return r.content, r.headers.get("Content-Type", "application/octet-stream")

_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime", "video/x-matroska"}
MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_VIDEO_BYTES = 60 * 1024 * 1024

@api.post("/uploads")
async def upload_file(file: UploadFile = File(...), admin: dict = Depends(get_admin_user)):
    ct = (file.content_type or "").lower()
    is_image = ct in _IMAGE_TYPES
    is_video = ct in _VIDEO_TYPES
    if not (is_image or is_video):
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ct}")
    data = await file.read()
    limit = MAX_IMAGE_BYTES if is_image else MAX_VIDEO_BYTES
    if len(data) > limit:
        raise HTTPException(status_code=413, detail=f"File too large. Max {limit // (1024*1024)} MB")
    ext = (file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else ("jpg" if is_image else "mp4")).lower()
    path = f"{APP_NAME}/uploads/{admin['id']}/{uuid.uuid4()}.{ext}"
    result = _put_object(path, data, ct)
    file_id = str(uuid.uuid4())
    doc = {
        "file_id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename or f"file.{ext}",
        "content_type": ct,
        "size": result.get("size", len(data)),
        "kind": "image" if is_image else "video",
        "uploaded_by": admin["id"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.files.insert_one(doc)
    return {"file_id": file_id, "url": f"/api/files/{file_id}", "kind": doc["kind"], "content_type": ct, "size": doc["size"]}

@api.get("/files/{file_id}")
async def serve_file(file_id: str):
    rec = await db.files.find_one({"file_id": file_id, "is_deleted": False})
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")
    data, ct = _get_object(rec["storage_path"])
    return Response(content=data, media_type=rec.get("content_type") or ct, headers={"Cache-Control": "public, max-age=86400"})

# ---------------- Startup ----------------
@app.on_event("startup")
async def on_startup():
    _init_storage()
    await db.users.create_index("email", unique=True, partialFilterExpression={"email": {"$type": "string", "$gt": ""}})
    await db.users.create_index("phone")
    # OTP TTL cleanup: docs auto-purged 15 min after creation
    await db.otp_codes.create_index("created_at")
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "mahendharbadala0@gmail.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "Mahi@1234")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "name": "Satthamma Admin",
            "phone": "8500812044",
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password), "role": "admin"}})
    else:
        await db.users.update_one({"email": admin_email}, {"$set": {"role": "admin"}})

    # Seed default products if none
    count = await db.products.count_documents({})
    if count == 0:
        seed = [
            {"name": "Organic Corn", "category": "grains", "price": 60, "unit": "kg", "description": "Sun-dried, chemical-free corn kernels from our fields.", "image_url": "https://images.unsplash.com/photo-1601543527048-2379e2e6dfe4?auto=format&fit=crop&w=1200&q=80", "stock": 120, "featured": True},
            {"name": "Golden Maize", "category": "grains", "price": 55, "unit": "kg", "description": "Freshly harvested maize, hand-selected for quality.", "image_url": "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1200&q=80", "stock": 150, "featured": True},
            {"name": "Sona Masuri Paddy", "category": "grains", "price": 45, "unit": "kg", "description": "Premium paddy grown without synthetic fertilizers.", "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=80", "stock": 200, "featured": True},
            {"name": "Mango Avakaya Pickle", "category": "pickles", "price": 320, "unit": "500g", "description": "Traditional Telangana style mango pickle, hand-pounded masalas.", "image_url": "https://images.unsplash.com/photo-1613271596363-4fb96ef16eac?auto=format&fit=crop&w=1200&q=80", "stock": 80, "featured": True},
            {"name": "Gongura Pickle", "category": "pickles", "price": 280, "unit": "500g", "description": "Tangy sorrel leaves pickle, a Telugu household favorite.", "image_url": "https://images.pexels.com/photos/11584813/pexels-photo-11584813.jpeg?auto=compress&cs=tinysrgb&w=1200", "stock": 60},
            {"name": "White Sesame Seeds", "category": "seeds", "price": 240, "unit": "kg", "description": "Cold-cleaned sesame seeds, rich in flavour and nutrition.", "image_url": "https://images.unsplash.com/photo-1610725663727-08695a1ac3ff?auto=format&fit=crop&w=1200&q=80", "stock": 90},
            {"name": "Toor Dal (Kandi Pappu)", "category": "pulses", "price": 180, "unit": "kg", "description": "Home-grown toor dal, no polish, no additives.", "image_url": "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=1200&q=80", "stock": 140, "featured": True},
            {"name": "Green Moong Dal", "category": "pulses", "price": 160, "unit": "kg", "description": "Whole green gram, protein rich and pesticide-free.", "image_url": "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=1200&q=80", "stock": 110},
            {"name": "Organic Cotton (Raw)", "category": "cotton", "price": 90, "unit": "kg", "description": "Rainfed cotton grown without harmful pesticides.", "image_url": "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?auto=format&fit=crop&w=1200&q=80", "stock": 300},
            {"name": "Chilli Powder (Guntur)", "category": "spices", "price": 380, "unit": "kg", "description": "Sun-dried Guntur chillies, stone-ground in small batches.", "image_url": "https://images.unsplash.com/photo-1716816211590-c15a328a5ff0?auto=format&fit=crop&w=1200&q=80", "stock": 70, "featured": True},
            {"name": "Turmeric Powder", "category": "spices", "price": 300, "unit": "kg", "description": "High-curcumin turmeric from our organic patch.", "image_url": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80", "stock": 85},
            {"name": "Gadka (Kodo Millet)", "category": "grains", "price": 130, "unit": "kg", "description": "Ancient millet variety, naturally gluten-free.", "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=80", "stock": 95},
        ]
        for s in seed:
            s["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.products.insert_many(seed)

app.include_router(api)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
