from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
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
    notes: Optional[str] = ""

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
async def create_order(payload: OrderIn, user: dict = Depends(get_current_user)):
    total = 0.0
    items_full = []
    for it in payload.items:
        try:
            p = await db.products.find_one({"_id": ObjectId(it.product_id)})
        except Exception:
            continue
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
    doc = {
        "user_id": user["id"],
        "user_email": user["email"],
        "items": items_full,
        "total": total,
        "address": payload.address,
        "phone": payload.phone,
        "notes": payload.notes or "",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.orders.insert_one(doc)
    doc["_id"] = res.inserted_id
    return {"id": str(res.inserted_id), "total": total, "status": "pending"}

@api.get("/orders/mine")
async def my_orders(user: dict = Depends(get_current_user)):
    docs = await db.orders.find({"user_id": user["id"]}).sort("created_at", -1).to_list(200)
    return [{**{k: v for k, v in d.items() if k != "_id"}, "id": str(d["_id"])} for d in docs]

@api.get("/admin/orders")
async def all_orders(_admin: dict = Depends(get_admin_user)):
    docs = await db.orders.find({}).sort("created_at", -1).to_list(1000)
    return [{**{k: v for k, v in d.items() if k != "_id"}, "id": str(d["_id"])} for d in docs]

@api.get("/admin/users")
async def all_users(_admin: dict = Depends(get_admin_user)):
    docs = await db.users.find({}).sort("created_at", -1).to_list(1000)
    return [user_to_public(d) for d in docs]

# ---------------- Startup ----------------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True, partialFilterExpression={"email": {"$type": "string", "$gt": ""}})
    await db.users.create_index("phone")
    # OTP TTL cleanup: docs auto-purged 15 min after creation
    await db.otp_codes.create_index("created_at")
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@satthammafarms.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")
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
